const socket = io('https://77337a44-1cd4-4f21-8a22-b7143fbf5ef8-00-23wzsy35jfxha.sisko.replit.dev:5000/');
let aiGame = false;
let gameReset = false;
let clickTrigger = false;
let numSelected = true;
let decisionTimer = null;
let prevScore = 0;
let hurrayInterval = null;
let noHurray = false;
let gameOver = false;
let soundOn = true;
let serverUp =true;

const user = {
  id: null,
  name: null,
  room: null,
  partners: []
};
let darkerShade = '#2b5c74';
socket.on("connect", () => {
  console.log("✅ Connected to server!");
  serverUp = true;
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

socket.on("connect_error", (err) => {
  serverUp = false;
});

socket.on("error", (m) => {
  gameOver = true;
  gameReset = true;
  gameRefresh();
  document.getElementById("loader").classList.add("d-none")
  setTimeout(() => showAlert("error",m, 2000), 200)
  setTimeout(() => document.getElementById("alert-bar").classList.add("d-none"), 5000)
});
    
let waitingTimer;

socket.on("number-received", (me, val, name) => {
  let meName = (me === user.name) ? 'You' : me;
  let pName = (name === user.name) ? 'Your' : (name + "'s");

  showAlert("msg", `${meName} selected ${val}. It's ${pName} turn.`, null);
  // document.getElementById("selectedNumber").innerText = `${meName} selected ${val}. It's ${pName} turn.`

  for (let i = 1; i <= 25; i++)
    document.getElementById(`my-cell-${i}`).disabled = true;

  selectNumber(val);
  scoring("my");

  // 🔁 Reset waiting timer for the next person's turn
  clearTimeout(waitingTimer);
  document.getElementById("message-box").classList.add("d-none");

  // 🔄 Only start timer if it's NOT your turn
  if (name !== user.name) {
    waitingTimer = setTimeout(() => {
      let stWaitMsg = `${name} has not chosen a number yet?`;
      let waitMessages = [
      "Maybe they're just building suspense... 🧐",
      "Maybe they forgot it's their turn... 👀",
      "They're deep in strategy mode. Or maybe snack mode. 🍿",
      "They might be meditating on the number's deeper meaning. 🧘‍♂️",
      "'Is this my destiny number?' – probably what they're thinking 😄",
      "We suspect a dramatic pause for effect... 🎬",
      "Plotting a legendary Bingo comeback? Possibly. 😂",
      "Trying to channel the Bingo spirits, maybe. 🔮"
      ];
      messageBoxDisplay(stWaitMsg, waitMessages[Math.floor(Math.random() * waitMessages.length)]);
      setTimeout(() => clearTimeout(loaderTimer));
    }, 15000);
  }
});

function selectNumber(number){   
  for(let i=1; i<=25; i++){
    document.getElementById(`my-cell-${i}`).disabled = true;
    if(document.getElementById(`my-cell-${i}`).innerText === number){
      numSelected =  false;
      document.getElementById(`my-cell-${i}`).classList.add('selected')
    }
    }
  }

function registerUser(event){
    event.preventDefault();
    user.name = document.getElementById("user").value;
    if (!socket.connected) socket.connect();
    socket.emit("register", user.name);

    slideAndVanish("user-form");
    setLoader();
}

socket.on("yourID", (id) => {
  document.getElementById("myID").innerText = id;
  user.id = id;
  document.getElementById("connect-form").classList.remove("d-none");
  // document.getElementById("connect-form").classList.remove("drop-out");
  // document.getElementById("connect-form").classList.add("drop-in");
  // document.getElementById("connect-form").classList.add("drop-in");
  document.getElementById("id").focus()
  document.getElementById("loader").classList.add("d-none")
})


function connectUser(event){
  event.preventDefault();
  let pId = document.getElementById("id").value;
  slideAndVanish("connect-form")
  // document.getElementById("user-form").classList.remove("drop-in");
  // document.getElementById("user-form").classList.add("drop-out");
  // document.getElementById("connect-form").classList.remove("drop-in");
  // document.getElementById("connect-form").classList.add("drop-out");
  setLoader();
  socket.emit("askConnection", user.id, pId);
}

socket.on("connectionRequest", (pid, pname) => {
  document.getElementById("loader").classList.add("d-none");
  let partnerElement = document.getElementById("pName");
  if(partnerElement.innerText !== ""){
    partnerElement.innerText += ", ";
    partnerElement.innerText += pname;
  }else{
    partnerElement.innerText = pname;
  }
  if(partnerElement.hasAttribute("data-info")){
    let existingId = partnerElement.getAttribute("data-info");
    existingId += ","+pid
    partnerElement.setAttribute("data-info", existingId)
  }else{
    partnerElement.setAttribute("data-info", pid)
  }
  // document.getElementById("user-form").classList.remove("drop-in");
  // document.getElementById("user-form").classList.add("d-none");
  // document.getElementById("connect-form").classList.remove("drop-in");
  // document.getElementById("connect-form").classList.add("d-none");
  slideAndVanish("user-form")
  // slideAndVanish("connect-form")
  document.getElementById("permission-form").classList.remove("d-none");
  document.getElementById("permission-form").classList.remove("pop-out");
  document.getElementById("permission-form").classList.add("pop-in");
});


function connectPartner(event, res){
  event.preventDefault();
  document.getElementById("connect-form").classList.add("d-none");
  document.getElementById("bingo-box").classList.remove("d-none");
  document.getElementById("permission-form").classList.add("pop-out");
  document.getElementById("permission-form").classList.remove("pop-in");
  setTimeout(()=>{
  document.getElementById("permission-form").classList.add("d-none");
  }, 4000)
  setLoader();
  let pName = document.getElementById("pName").innerText;
  let pId = document.getElementById("pName").getAttribute("data-info")
  if (!pId) return;
  let pIdArr = pId.split(",")
  if(res === "yes"){
    pIdArr.forEach(p_id =>  {
      socket.emit("connectWith", p_id)
    })
  }else{
    pIdArr.forEach(p_id => {
      socket.emit("permission-error", `Connection rejected by ${pName}.`, p_id);
    })
    gameOver = true;
    gameReset = true;
    gameRefresh();
    document.getElementById("loader").classList.add("d-none")
  }
}

socket.on("partner-list", list => {
  user.partners = list.filter(l => l.id !== user.id);
  let partEle = document.getElementById("partner");
  partEle.innerText = user.partners.map(p => p.name).join(", ");
})

socket.on("room-connected", (room, partner) => {
  slideAndVanish("main-screen");
  user.room = room
  document.getElementById("loader").classList.add("d-none");
  document.getElementById("connect-form").classList.add("d-none");
  document.getElementById("bingo-box").classList.remove("d-none");
  document.getElementById("play-with").classList.remove("d-none")
})

socket.on("partnerDisconnected", (pName) => {
  gameOver = true;
  gameReset = true;
  document.querySelector('.result').classList.remove('d-none');
  document.getElementById("alert-bar").classList.add("d-none");
  clearTimeout(loaderTimer)
  clearTimeout(decisionTimer);
  clearTimeout(waitingTimer)
  document.querySelector('.result #result-data').innerText = `Oops! ${pName} has left the game`;
    document.getElementById("message-box").classList.add("d-none")
  socket.disconnect();
});

// Generate Numbers in random order
function generateNumbers(e){
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  for(let i=numbers.length-1; i>0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  for(let i=1; i<=25; i++){
    document.getElementById(`${e}-cell-${i}`).innerText = numbers[i-1]
  }
}
// render again
function renderGame(e){
  generateNumbers(e);
  for(let i=1; i<=25; i++){
    if(document.getElementById(`${e}-cell-${i}`).classList.contains('selected')){
      document.getElementById(`${e}-cell-${i}`).classList.remove('selected')
    }
  }
    for(let i=0; i < 5; i++){
      if(document.querySelectorAll(`#${e}Bingo span`)[i].classList.contains('set'))
      document.querySelectorAll(`#${e}Bingo span`)[i].classList.remove('set')
    }
}

// Calculating Score
function countScore(e) {
  const lines = [
    // Rows
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
    // Columns
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [5, 10, 15, 20, 25],
    // Diagonals
    [1, 7, 13, 19, 25],
    [5, 9, 13, 17, 21],
  ];

  let score = 0;

  for (const line of lines) {
    const allSelected = line.every(cell => 
      document.getElementById(`${e}-cell-${cell}`).classList.contains('selected')
    );
    if (allSelected) score++;
  }

  return Math.min(score, 5); // Enforce max of 5 if needed
}


function finishGame(e){
  clearTimeout(waitingTimer);
  clearTimeout(decisionTimer);
  document.getElementById("message-box").classList.add("d-none");
  document.getElementById("alert-bar").classList.add("d-none");
  if (gameOver) return; // prevent multiple triggers
  gameOver = true;
  document.querySelector('.result').classList.remove('d-none');
  if(e =='my'){
    wonStorage()
    document.querySelector('.result #result-data').innerText = "WON...👏";
      if(soundOn){
        document.getElementById('winSound').currentTime = 0;
        document.getElementById('winSound').play();
      }
    if(!aiGame) socket.emit("finished", user.room, "won", user.name)
  }
  else{
      loseStorage();
      if(soundOn){
        document.getElementById('outSound').currentTime = 0;
        document.getElementById('outSound').play();
      }
      clearTimeout(loaderTimer)
      clearTimeout(decisionTimer);
      clearTimeout(waitingTimer)
    document.querySelector('.result #result-data').innerText = "OOPS, Better luck next time! 🎲";
    
    document.getElementById("message-box").classList.add("d-none")
  }
}

function wonStorage(){
  let wonCount = localStorage.getItem("wonCount") || 0;
  wonCount++;
  localStorage.setItem("wonCount", wonCount)
  let wonFrom = JSON.parse(localStorage.getItem("wonFrom") || "[]");
  let newWonFrom = (document.getElementById("partner") && document.getElementById("partner").innerText !== '') ?
  document.getElementById("partner").innerText: 'Bot'
  wonFrom.push(newWonFrom) ;
  localStorage.setItem("wonFrom", JSON.stringify(wonFrom));
}

function loseStorage(){
  let loseCount = localStorage.getItem("loseCount") || 0;
  loseCount++;
  localStorage.setItem("loseCount", loseCount)
  let loseFrom = JSON.parse(localStorage.getItem("loseFrom") || "[]");
  let newloseFrom = (document.getElementById("partner") && document.getElementById("partner").innerText !== '') ?
  document.getElementById("partner").innerText: 'Bot'
  loseFrom.push(newloseFrom) ;
  localStorage.setItem("loseFrom", JSON.stringify(loseFrom));
}

socket.on("gameEnd",(w, winner) => {
  if(countScore(`my`) === 5){
    document.querySelector('.result').classList.remove('d-none');
    wonStorage();
    document.querySelector('.result #result-data').innerText = winner + " and you, both WON ...👏";
  }
  else if(w == 'won'){
    document.querySelector('.result').classList.remove('d-none');
    loseStorage();
    document.querySelector('.result #result-data').innerText = winner + " WON, Better luck next time! 🎲";
  }
})

function gameRefresh(){
  clearTimeout(waitingTimer);
  clearTimeout(decisionTimer);
  document.getElementById("message-box").classList.add("d-none");
  prevScore = 0;
  gameOver = false;
  document.querySelector('.result').classList.add('d-none');
  document.getElementById('numberOrder').disabled = false;
  document.getElementById("user").value = ''
  document.getElementById('id').value = '';
  // document.getElementById("selectedNumber").innerText = '';
  if(gameReset){
    document.getElementById("play-with").classList.add("d-none")
    document.getElementById("main-screen").classList.remove("d-none")
    document.getElementById("bingo-box").classList.add("d-none")
    aiGame = false
    renderGame('my');
    const ai = document.getElementById("ai") ? document.getElementById("ai") : null ;
    if(ai) ai.remove();
    if(socket.connected) socket.disconnect();
  }else{
    if(aiGame){
    document.querySelectorAll(`#aiBingo span`).forEach(e => {e.classList.remove('set'); e.style.backgroundColor=''})
    for(let i = 1; i<= 25; i++){
      document.getElementById(`ai-cell-${i}`).disabled = true;
      document.getElementById(`ai-cell-${i}`).classList.remove('selected');
    }
    }
  }
  
    document.querySelectorAll(`#myBingo span`).forEach(e => {e.classList.remove('set'); e.style.backgroundColor=''})
    for(let i = 1; i<= 25; i++){
      document.getElementById(`my-cell-${i}`).disabled = false;
      document.getElementById(`my-cell-${i}`).classList.remove('selected');
    }
    document.getElementById("alert-bar").classList.add("d-none");
}

function gameEnd(){
  gameReset = true;
  gameRefresh();
}

function scoring(e){

  // count score
  let score = countScore(`${e}`);
  if (score > 5) score = 5;
  // mark bingo characters
  if(score > 0 && !gameOver){
    for(let i=0; i < score; i++){
      document.querySelectorAll(`#${e}Bingo span`)[i].classList.add('set');
      if(e === 'my')
      document.querySelectorAll(`#${e}Bingo span`)[i].style.backgroundColor = darkerShade
    }
  }
  // if won
  if(score === 5){
    noHurray = true;
    finishGame(e);
    return
  }else if(e == 'my' && score > prevScore){
    displayHurray();
    prevScore = score;
  }
}

// AI selecting Number
function AISelect(){
  // AI selection
  const lines = [
    ['ai-cell-1', 'ai-cell-2', 'ai-cell-3', 'ai-cell-4', 'ai-cell-5'],
    ['ai-cell-6', 'ai-cell-7', 'ai-cell-8', 'ai-cell-9', 'ai-cell-10'],
    ['ai-cell-11', 'ai-cell-12', 'ai-cell-13', 'ai-cell-14', 'ai-cell-15'],
    ['ai-cell-16', 'ai-cell-17', 'ai-cell-18', 'ai-cell-19', 'ai-cell-20'],
    ['ai-cell-21', 'ai-cell-22', 'ai-cell-23', 'ai-cell-24', 'ai-cell-25'],
    ['ai-cell-1','ai-cell-6', 'ai-cell-11', 'ai-cell-16', 'ai-cell-21'],
    ['ai-cell-2', 'ai-cell-7', 'ai-cell-12', 'ai-cell-17', 'ai-cell-22'],
    ['ai-cell-3', 'ai-cell-8', 'ai-cell-13', 'ai-cell-18', 'ai-cell-23'],
    ['ai-cell-4', 'ai-cell-9', 'ai-cell-14', 'ai-cell-19', 'ai-cell-24'],
    ['ai-cell-5', 'ai-cell-10', 'ai-cell-15', 'ai-cell-20', 'ai-cell-25'],
    ['ai-cell-1', 'ai-cell-7', 'ai-cell-13', 'ai-cell-19', 'ai-cell-25'],
    ['ai-cell-21', 'ai-cell-17', 'ai-cell-13', 'ai-cell-9', 'ai-cell-5'],
  ];
  for(let target = 4; target>=1; target--){
    for (const line of lines) {
      const selected = line.filter(id => document.querySelector(`#ai #${id}`).classList.contains('selected'))
      const unselected = line.filter(id => !document.querySelector(`#ai #${id}`).classList.contains('selected'))  
      if(selected.length == target && unselected.length == 5 - target){
        showAlert("msg","Bot selected " + document.getElementById(unselected[0]).innerText, null) ;
        return unselected[0];
      }
    }
  }
  
  let num;
  do {
    num = Math.floor(Math.random() * 25) + 1; // pick 1–25
    let selectedNumber = "Bot selected " + document.querySelector(`#ai-cell-${num}`).innerText;
    showAlert("msg",selectedNumber, null) ;
  } while (document.querySelector(`#ai-cell-${num}`).classList.contains('selected'));
  return `ai-cell-${num}`
}

// when a number is clicked
function cellClick(e){
  document.getElementById("alert-bar").classList.add("d-none")
  document.getElementById('numberOrder').disabled = true;

  const val = e.target.innerText;

  if(aiGame){
    let selectedNumber = "You selected " + val;
    // document.getElementById("selectedNumber").innerText = selectedNumber;
  }


  if(e.target.classList.contains('selected')){
    let timer = aiGame? 2000 : null;
    showAlert("error",`${val} was already selected. Choose a different number.`, timer)
    numberSelectingDecision();
    return;
  }else if(soundOn){
    // const clickSound = document.getElementById("clickSound");
    // clickSound.playbackRate = 2.0; // 2x speed
    // clickSound.currentTime = 0;
    // clickSound.play();
  }
  // mark selected number
  e.target.classList.add('selected');

  scoring('my');
  if(aiGame)
  scoring('ai');
  
  for(let i = 1; i<= 25; i++)
    document.getElementById(`my-cell-${i}`).disabled = true;

  numSelected = true;
  clearTimeout(decisionTimer);
  document.getElementById("message-box").classList.add("d-none");

  if(aiGame){
    for(let i = 1; i<=25; i++){
      if(document.getElementById(`ai-cell-${i}`).innerText == val){
        document.getElementById(`ai-cell-${i}`).classList.add('selected');
      }
    }
    // AI selecting number
    setTimeout(function() {
      
      let cellNum = AISelect();
      document.querySelector(`#${cellNum}`).classList.add('selected');
      const aiCell = document.querySelector(`#${cellNum}`);
      aiCell.classList.add('ai-flash');
      setTimeout(() => {
        aiCell.classList.remove('ai-flash');
      }, 500);
            
      // marking the ai selected number in client card
      let numV = document.querySelector(`#${cellNum}`).innerText;
      for(let i = 1; i<=25; i++){
        if(document.querySelector(`#my-cell-${i}`).innerText == numV){
          document.querySelector(`#my-cell-${i}`).classList.add('selected');
        }
      }

      scoring('ai');
      scoring('my');

      for(let i = 1; i<= 25; i++)
        document.getElementById(`my-cell-${i}`).disabled = false;
      }, 200);
      numSelected = false;
      numberSelectingDecision();
  }else{
    if (socket && socket.connected){
      socket.emit("number-selected", user.room, val);
      for(let i=1; i<=25; i++)
        document.getElementById(`my-cell-${i}`).disabled = true;
      showAlert("msg",`You selected ${val}. It's ${user.partnerName}'s turn.`, null)
      // document.getElementById("selectedNumber").innerText = `You selected ${val}. It's ${user.partnerName}'s turn.`
    }
  }
}

function numberSelectingDecision(){
  decisionTimer = setTimeout(() => {
    let messages = [
    "⏳ Hurry up! Your Bingo vibe is giving Sunday nap energy 🐢",
    "⏳ Are you picking a number or solving a mystery 🐢? ",
    "🐢 You want chai while you decide or what? Hurry up ⏳!",
    "🐢 Thinking this hard for Bingo? Respect! 😂 But please hurry up!",
    "🐢 The number's getting old waiting to be selected! ⏳",
    "⏳ Your number is coming from Murree on foot? 😂 Please hurry up!",
    "⏳ Did the number go out for chai? 🐢 Call it before it gets cold!",
    "⏳ Even the turtle finished his game. Let’s speed it up!",
    "⏳ Hyy, this isn’t a Netflix series — no suspense needed! 😄",
    "🤔 It’s just a number, not a life decision. Let’s go! ⏳",
    "⏳ The Bingo board is getting wrinkles waiting for you 🐢! ",
    "⏳I think your number is stuck in traffic! 🚗 Please call it already!",
    "😴 If you take any longer, we might need a nap break!",
    "⏳ Even biryani cooks faster than this decision! 🍛😂",
    "⏳ Are you composing a poem or picking a number? 🎭 Let's go!"
  ];
    if(!numSelected)
      messageBoxDisplay("Still Deciding...?", messages[Math.floor(Math.random()*messages.length)])
    setTimeout(() => clearTimeout(decisionTimer), 50)
  }, 15000)
}

socket.on("myTurn", ()=>{
  numSelected = false;
  // clearTimeout(decisionTimer);
  for(let i=1; i<=25; i++){
    document.getElementById(`my-cell-${i}`).disabled = false;
  }
  numberSelectingDecision()
})

window.addEventListener('load', function(e) {

  setTimeout(function() {
    if(
    !(this.localStorage && localStorage.getItem("oldUser"))
  ){
    e.stopPropagation();
    document.getElementById("intro-card").classList.add("pop-in");
    document.getElementById("intro-card").classList.remove("d-none");
    this.localStorage.setItem("oldUser", 1)
  }
  }, 1500)


  document.getElementById("loader").classList.add("d-none");
  generateNumbers('my');

  setTimeout(function() {
    const element = document.querySelector('.welcome');
    element.classList.add('exit');
    element.addEventListener('transitionend', () => {
      element.remove();
    });
    document.querySelector("main").classList.remove("d-none")
      }, 1500) 
});

function closeIntro(){
    document.getElementById("intro-card").classList.remove("pop-in");
    document.getElementById("intro-card").classList.add("pop-out");
    setTimeout(()=> document.getElementById("intro-card").classList.add("d-none"), 380);
}

function playFriends(){
  if(serverUp){
    slideAndVanish("main-screen")
    document.getElementById("user-form").classList.remove("d-none");
    const ai = document.getElementById("ai") ? document.getElementById("ai") : null ;
      if(ai) ai.remove();
      aiGame = false;
    document.getElementById("user").focus()
  }else{
    showAlert("error", "Unable to connect to the server. Please contact the author to enable Multi-Player feature", 2000);
  }
}

function playAI(){
  // document.getElementById("selectedNumber").style.padding = "2px 10px";
  // document.getElementById("selectedNumber").innerText = "Choose a Number"
  document.getElementById("bingo-box").classList.remove("d-none")
  slideAndVanish("main-screen");
  if(!document.getElementById("ai")){
    aiGame = true;
    createAiCard()
  }
}

function slideAndVanish(eId){
  document.getElementById(eId).classList.add("slide-out");
  setTimeout(()=> {
    document.getElementById(eId).classList.add("d-none");
    document.getElementById(eId).classList.remove("slide-out")
  }, 500)
}

function createAiCard(){
  const container = document.getElementById('bingo-box');

  const aiBox = document.createElement("div");
  aiBox.id = "ai";
  aiBox.className = "bingo-card";

  const title = document.createElement('div');
  title.id = 'aiBingo';
  title.className = 'pacifico-regular';

  ['B', 'I', 'N', 'G', 'O'].forEach(letter => {
    const span = document.createElement("span");
    span.setAttribute("role", "button");
    span.setAttribute("tabindex", "0");
    span.textContent = letter;
    title.appendChild(span);
  })

  aiBox.appendChild(title);

  const numbers = Array.from({length:25}, (_, i) => i+1)
                  .sort(() => Math.random() - 0.5);

  for(let i=0; i<5;i++){
    const row = document.createElement('div');
    row.className = 'row d-flex fj-center f-row fa-center';
    for(let j=0; j<5; j++){
      let index = i*5+j
      const btn = document.createElement('button');
      btn.className = 'd-flex fj-center fa-center';
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('disabled', 'true');
      btn.id = `ai-cell-${index + 1}`;
      btn.textContent = numbers[index];
      btn.addEventListener("click", cellClick);
      row.appendChild(btn);
    }
    aiBox.appendChild(row);
  }
  container.appendChild(aiBox);
}

document.getElementById("alert-close").addEventListener("click", () => {
  document.getElementById("alert-bar").classList.add("d-none");
})

function showAlert(type,m, timer){
  let alertB =  document.getElementById("alert-bar");
  alertB.className = '';
  alertB.classList.add(`${type}-alert`);
  alertB.classList.remove("d-none")
  document.getElementById("message").innerText=m;
  if(timer)
  setTimeout(() => {
    if(!( alertB.classList.contains("d-none") ))
      document.getElementById("alert-bar").classList.add("d-none")
  }, timer)
}

document.querySelector("#main-screen a").addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("intro-card").classList.remove("pop-out");
  document.getElementById("intro-card").classList.remove("d-none")
  document.getElementById("intro-card").classList.add("pop-in")
  // setTimeout(()=>{
    // document.addEventListener('click', outsideEvent)
  // }, 0)
})

let loaderTimer = null;

function setLoader() {
  // Clear previous timer **before** resetting it
  if (loaderTimer) clearTimeout(loaderTimer);

  loaderTimer = setTimeout(() => {
    const loader = document.getElementById("loader");

    // If loader is still visible, show error
    if (!loader.classList.contains("d-none")) {
      loader.classList.add("d-none");
      gameOver = true;
      gameRefresh();
      setTimeout(() => showAlert("error","Error occurred!", 4000), 200)
      setTimeout(() => document.getElementById("alert-bar").classList.add("d-none"), 2000);
      document.getElementById("main-screen").classList.remove('d-none');
    }
  }, 20000); // or 10000 for 10 seconds

  // Now hide the loader (or do it earlier depending on flow)
  document.getElementById("loader").classList.remove("d-none");
}

function copyID() {
  var myId = document.getElementById("myID").innerText;
  navigator.clipboard.writeText(myId)
    .then(() => showAlert("msg","Copied", 2000))
    .catch(err => showAlert("error", "Failed to copy: " + err, 4000));
}

function hexToHSL(hex) {
  // Remove "#" if present
  hex = hex.replace(/^#/, '');

  // Convert shorthand hex to full
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }

  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function selectCardColor(color){
  const colors = {
    darkred: 'hsl(0, 100%, 27%)', // darkred
    teal: 'hsl(165, 100%, 27%)', // #008b6b 
    ceruleanblue: 'hsl(196, 100%, 27%)',      // #006A8B
    cranberry: 'hsl(322, 100%, 27%)',         // #8b0063
    darkPurple: 'hsl(293, 52%, 20%)',         // #4a1753
    softPurple: 'hsl(288, 17%, 33%)',         // #5e4662
    black: 'hsl(0, 0%, 0%)',                  // black
    white: 'hsl(0, 0%, 100%)',                // white
    purple: 'hsl(307, 13%, 55%)',             // #967c9b
    grey: 'hsl(192, 70%, 13%)',               // #08313b
    lightGrey: 'hsl(196, 15%, 50%)',           // #6a838f
    lightGreen: 'hsl(88, 52%, 70%)', // #aed581
    darkGreen: 'hsl(106, 56%, 18%)', // #33691e
    lightSkyGreen: 'hsl(221, 44.70%, 85.10%)', // #c8e6c9
    skyblue: 'hsl(174, 39%, 60%)', // #4db6ac
    skyGreen: 'hsl(174, 100%, 24%)', // #00796b
    pink: 'hsl(349, 68%, 78%)' // #ef9eac
  };

  if (color in colors) {
    document.getElementById('my').removeAttribute('class');
    document.getElementById("my").classList.add(color)
    document.getElementById("my").classList.add('bingo-card');

    // document.getElementById("my").style.backgroundColor = color

    // const colorValue = hexToHSL(color)
    const colorValue = colors[color.toString()]
    // console.log(colorValue)

      const match = colorValue.match(/^hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)$/);
      if (!match) return;
      let [_, h, s, l] = match.map(Number)
      // console.log(h, s, l)
      const mainLightColor = `hsl(${h}, ${Math.max(10, s - 10)}%, ${Math.min(95, l + 20)}%)`;

      document.querySelector("#bingo-box a").style.color = mainLightColor;

      if (h > 170 && h < 180 && l > 50 && s < 50) {
        s = Math.min(100, s + 20);
        l = Math.max(20, l - 18); // stronger darkening
      } else {
        // General darkening
        if (s < 50) s += 10;
        l = Math.max(10, l - (l > 60 ? 15 : l > 40 ? 12 : 8));
      }
      darkerShade = `hsl(${h}, ${s}%, ${l}%)`;
      document.getElementById("numberOrder").style.backgroundColor = darkerShade;
      // document.getElementById("selectedNumber").style.color = darkerShade;
      document.getElementById("numberOrder").style.borderColor = darkerShade;
      document.getElementById("play-with").style.color = darkerShade;

      const scoredNumber = document.querySelectorAll("#myBingo span.set");

      scoredNumber.forEach(span => span.style.backgroundColor = darkerShade)

      const buttons = document.querySelectorAll('#my div button');
      const textColor = getContrastTextColor(color);

      buttons.forEach(btn => {
        // if(!btn.classList.contains('selected')){
              // btn.style.color = textColor
          if(!btn.classList.contains('selected')) {
            btn.addEventListener('mouseenter', () => {
              btn.style.backgroundColor = darkerShade // hover color
            });

            btn.addEventListener('mouseleave', () => {
              btn.style.backgroundColor = ''; // reset to default
            });
          }else if(btn.classList.contains('selected')){
            btn.style.backgroundColor = "transparent";
          }
        // }
      });

    }
}

function getContrastTextColor(hex) {
  hex = hex.replace(/^#/, '');

  // Expand shorthand
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? 'black' : 'white';
}

document.getElementById("color-close").addEventListener("click", () => {
    document.getElementById("color-card").classList.add("pop-out");
    setTimeout(()=> document.getElementById("color-card").classList.add("d-none"), 380);
})

function ShowColorCard(event){
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("color-card").classList.remove("pop-out");
  document.getElementById("color-card").classList.remove("d-none");
  document.getElementById("color-card").classList.add("pop-in");
  clearTimeout(loaderTimer);
  clearTimeout(decisionTimer);
  clearTimeout(waitingTimer);
  document.getElementById("message-box").classList.add("d-none");
  // setTimeout(()=>{
    // document.addEventListener('click', outsideEvent)
  // }, 0)
}

function askConfirmation(){
  document.getElementById("disconnect-form").classList.remove('d-none');
  document.getElementById("disconnect-form").classList.add('pop-in');
}

function endGame(event, res){
  event.preventDefault();
  // console.log(res, res === 'no')
  document.getElementById('disconnect-form').classList.add('pop-out');
  setTimeout(() => {
    document.getElementById('disconnect-form').classList.add("d-none"); 
    document.getElementById('disconnect-form').classList.remove("pop-out")}, 380);
  if(res === 'no'){
    return
  }
  else{
    gameOver = true;
    gameReset = true;
    selectCardColor('lightGrey');
    gameRefresh();
  }
}

function goBack(parentID){
  let prevElement = 'main-screen';
  if(parentID === 'bingo-box'){
    askConfirmation();
    return
  }
  if(parentID){
    if(parentID === 'connect-form'){
      document.getElementById("id").value = "";
      prevElement = 'user-form';
    }
    if(parentID === 'user-form'){
      document.getElementById("user").value = "";
    }
  }
  slideAndVanish(parentID);
  document.getElementById(prevElement).classList.remove('d-none');
}

// function colorCards(){
//   const colors
// }

const infoBox = document.getElementById("intro-card");
const colorBox = document.getElementById("color-card");
const commentsBox = document.getElementById("message-box");
// const historyBox = document.getElementById("history-details");

function outsideEvent(event) {
  const clickedOutsideInfo = !infoBox.children[0].contains(event.target);
  const clickedOutsideColor = !colorBox.children[0].contains(event.target);
  const clickedOutsideComments = !commentsBox.contains(event.target);
  // const clickedOutsideHistory = !historyBox.contains(event.target);

  if (clickedOutsideInfo && !infoBox.classList.contains("d-none")) {
    infoBox.classList.add('pop-out');
    setTimeout(() => {infoBox.classList.add("d-none"); infoBox.classList.remove("pop-out")}, 380);
  }

  if (clickedOutsideComments && !commentsBox.classList.contains("d-none")) {
    commentsBox.classList.add('pop-out');
    setTimeout(() => {commentsBox.classList.add("d-none"); commentsBox.classList.remove("pop-out")}, 380);
  }

  // if (clickedOutsideHistory && !historyBox.classList.contains("d-none")) {
  //   console.log("historuy ")
  //   historyBox.classList.add('pop-out');
  //   setTimeout(() => {historyBox.classList.add("d-none"); historyBox.classList.remove("pop-out")}, 380);
  // }

  if (clickedOutsideColor && !colorBox.classList.contains("d-none")) {
    colorBox.classList.add('pop-out');
    setTimeout(() => {colorBox.classList.add("d-none"); colorBox.classList.remove("pop-out")}, 380);
  }

  // if (clickedOutsideInfo || clickedOutsideColor) {
    // document.removeEventListener('click', outsideEvent);
  // }
}

// Prevent inside clicks from closing
infoBox.children[0].addEventListener('click', e => e.stopPropagation());
colorBox.children[0].addEventListener('click', e => e.stopPropagation());

document.addEventListener("click", outsideEvent);

document.getElementById("closeMessage").addEventListener('click', ()=>{
    document.getElementById("message-box").classList.add("pop-out");
    setTimeout(()=>{
      document.getElementById("message-box").classList.add("d-none");
    },4000)
})

function messageBoxDisplay(heading, msg){
  document.getElementById("message-box").classList.remove("pop-out");
  document.getElementById("message-box").classList.remove("d-none");
  document.getElementById("message-box").classList.add("pop-in");
  document.getElementById("message-popup").innerText = msg
  document.querySelector("#message-box h4").innerText = heading
}

// document.getElementById("cardcolorpicker").addEventListener("input", function () {
//   const color = this.value; // hex color like #ff0000
//   selectCardColor(color);
// });
function displayHurray(){
  if(noHurray){
    noHurray = false;
    return
  }else{
    hurrayInterval = setTimeout(() =>{
    document.getElementById("hurray").classList.remove("d-none");
    document.getElementById("hurray").classList.add("pop-fade");
    if(soundOn){
      document.getElementById('winSound').currentTime = 0;
      document.getElementById('winSound').play();
    }
    setTimeout(() => {
      document.getElementById("hurray").classList.remove("pop-fade");
      document.getElementById("hurray").classList.add("d-none");
    }, 800)
    }, 100)
  }
}

function volumeChange(){
  soundOn = !soundOn;
  let volEle = document.getElementById("volume")
  if(volEle.classList.contains("fa-volume-up")){
    volEle.classList.remove("fa-volume-up")
    volEle.classList.add("fa-volume-off")
  }else{
    volEle.classList.add("fa-volume-up")
    volEle.classList.remove("fa-volume-off")
  }
}

function openHistory(){
  if(!document.getElementById("history-details").classList.contains("d-none")){
      document.getElementById("history-details").classList.remove("pop-in");
      document.getElementById("history-details").classList.add("pop-out");
      setTimeout(()=>{
        document.getElementById("history-details").classList.add("d-none");
      }, 400)
      return
  }
  document.getElementById("history-details").classList.remove("pop-out");
  document.getElementById("history-details").classList.remove("d-none");
  document.getElementById("history-details").classList.add("pop-in");
  
  const loseCount = localStorage.getItem("loseCount");
  const wonCount = localStorage.getItem("wonCount");
  const wonArray = JSON.parse(localStorage.getItem("wonFrom") || "[]");
  const loseArray = JSON.parse(localStorage.getItem("loseFrom") || "[]");
  if(wonArray.length <= 0 && loseArray.length<=0){
    document.getElementById("total-game").innerHTML = "No Game History Found!";
    return
  }
  let wonNames = '';
  wonArray.forEach(w => {
    if(wonNames !== '')
      wonNames += ", " + w;
    else
      wonNames = w
  });
  let loseNames = '';
  loseArray.forEach(w => {
    if(loseNames !== '')
      loseNames += ", " + w;
    else
      loseNames = w
  });

  document.getElementById("total-game").innerHTML = `You played total <b>${loseCount+wonCount}</b> games`
  document.getElementById("won").innerText = `${wonArray.length} Won: `
  document.getElementById("lost").innerText = `${loseArray.length} Lost: `
  document.getElementById("won-from").innerText = `- You won againt ${wonNames}.`
  document.getElementById("lose-from").innerText = `- You lost to ${loseNames} `
}