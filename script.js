const socket = io();
let aiGame = false;
const user = {
  id: null,
  name: null,
  room: null,
  partners: []
}
socket.on("connect", () => {
  console.log("✅ Connected to server!", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

socket.on("error", (m) => {
  gameRefresh();
  setTimeout(() => showAlert("msg",m), 200)
  setTimeout(() => document.getElementById("alert-bar").classList.add("d-none"), 5000)
});
    
socket.on("number-received", (me, val, name) => {
  console.log(me, val, name)
  let meName = (me === user.name)? 'You': me
  let pName = (name === user.name)? 'Your': (name+"'s")
  showAlert("msg",`${meName} selected ${val}. It's ${pName} turn.`)
  for(let i=1; i<=25; i++)
    document.getElementById(`my-cell-${i}`).disabled = true;
  selectNumber(val);
  scoring("my")
})

function selectNumber(number){   
  for(let i=1; i<=25; i++){
    document.getElementById(`my-cell-${i}`).disabled = true;
    if(document.getElementById(`my-cell-${i}`).innerText === number)
      document.getElementById(`my-cell-${i}`).classList.add('selected')
    }
  }

function registerUser(event){
    event.preventDefault()
    user.name = document.getElementById("user").value;
    if(!socket.connected){
      socket.connect();
      socket.emit("register", user.name);
    }
    else
      socket.emit("register", user.name);
    slideAndVanish("user-form");
    // document.getElementById("user-form").classList.remove("drop-in");
    // document.getElementById("user-form").classList.add("drop-out");
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
  slideAndVanish("connect-form")
  document.getElementById("permission-form").classList.remove("d-none");
  // document.getElementById("permission-form").classList.remove("drop-out");
  // document.getElementById("permission-form").classList.add("drop-in");
});


function connectPartner(event, res){
  event.preventDefault();
  // slideAndVanish("permission-form");
  // document.getElementById("permission-form").classList.remove("drop-in");
  // document.getElementById("permission-form").classList.add("drop-out");
  slideAndVanish("permission-form")
  // document.getElementById("main-screen").classList.add("d-none");
  setLoader();
  let pId = document.getElementById("pName").getAttribute("data-info")
  let pIdArr = pId.split(",")
  console.log(pIdArr)
  if(res === "yes"){
    pIdArr.forEach(p_id =>  {
      socket.emit("connectWith", p_id)
    })
  }
}

socket.on("partner-list", list => {
  user.partners = list.filter(l => l.id !== user.id);
  let partEle = document.getElementById("partner");
  partEle.innerText = user.partners[0].name
  for(let i=1; i<user.partners.length; i++){
    partEle.innerText += ", "+ user.partners[i].name
  }
})

socket.on("room-connected", (room, partner) => {
  slideAndVanish("main-screen");
  user.room = room
  document.getElementById("loader").classList.add("d-none");
  document.getElementById("connect-form").classList.add("d-none");
  // document.getElementById("main-screen").classList.add("d-none");
  document.getElementById("play-with").classList.remove("d-none")
  console.log(partner)
  // let userAlready = false;
  // if(user.partner.find( u => u.id === partner.id)){
  //   userAlready = true;
  // }
  // if(!userAlready){
  //   user.partner.push(partner);
  //   console.log("partners", user.partner, user.partner && user.partner.length > 0)
  //   let partnerName = "";
  //   if(user.partner.length > 0)
  //     user.partner.forEach(p => partnerName += p.name + " ")
  //   let partEle = document.getElementById("partner");
  //   partEle.innerText = partnerName ? partnerName : "undefined"
  // }
  // (partEle.innerText !== ""  && partEle.innerText !== NaN)? (
  //   partEle.innerText + ", " + partnerName
  // )
  // : partnerName
  // console.log(innerText)
})

socket.on("partnerDisconnected", () => {

  document.querySelector('.result').classList.remove('d-none');
  document.querySelector('.result #result-data').innerText = `Oops! ${user.partnerName} has left the game`;

  socket.disconnect();
});

let gameOver = false;
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
function countScore(e){
  let score = 0
  if(document.getElementById(`${e}-cell-1`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-2`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-3`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-4`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-5`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-6`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-7`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-8`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-9`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-10`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-11`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-12`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-13`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-14`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-15`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-16`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-17`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-18`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-19`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-20`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-21`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-22`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-23`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-24`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-25`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  
  if(document.getElementById(`${e}-cell-1`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-6`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-11`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-16`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-21`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-2`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-7`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-12`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-17`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-22`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-3`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-8`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-13`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-18`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-23`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-4`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-9`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-14`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-19`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-24`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-5`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-10`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-15`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-20`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-25`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-1`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-7`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-13`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-19`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-25`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  if(document.getElementById(`${e}-cell-5`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-9`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-13`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-17`).classList.contains('selected') 
  && document.getElementById(`${e}-cell-21`).classList.contains('selected') 
  ){
    if(score < 5)
      score++;
  }
  return score;
}

function finishGame(e){
  if (gameOver) return; // prevent multiple triggers
    gameOver = true;
  document.querySelector('.result').classList.remove('d-none');
  if(e =='my'){
    document.querySelector('.result #result-data').innerText = "WON...👏";
    if(!aiGame) socket.emit("finished", user.room, "won")
  }
  else{
    document.querySelector('.result #result-data').innerText = "OOPS, YOU LOSE...👎";
  }
}

socket.on("gameEnd",w => {
  if(countScore(`my`) === 5){
    document.querySelector('.result').classList.remove('d-none');
    document.querySelector('.result #result-data').innerText = "You both WON ...👏";
  }
  else if(w == 'won'){
    document.querySelector('.result').classList.remove('d-none');
    document.querySelector('.result #result-data').innerText = "OOPS, YOU LOSE...👎";
  }
})

function gameRefresh(){
  gameOver = false;
  aiGame = false
  document.querySelector('.result').classList.add('d-none');
  document.getElementById("main-screen").classList.remove("d-none")
  document.getElementById('numberOrder').disabled = false;
  document.getElementById("user").value = ''
  document.getElementById('id').value = '';
  renderGame('my');
  const ai = document.getElementById("ai") ? document.getElementById("ai") : null ;
  if(ai) ai.remove();
  document.querySelectorAll(`#myBingo span`).forEach(e => e.classList.remove('set'))
  for(let i = 1; i<= 25; i++){
    document.getElementById(`my-cell-${i}`).disabled = false;
    document.getElementById(`my-cell-${i}`).classList.remove('selected');
  }
  document.getElementById("alert-bar").classList.add("d-none");
  if(socket.connected) socket.disconnect();
}

function scoring(e){

  // count score
  let score = countScore(`${e}`);
  // mark bingo characters
  if(score > 0 && !gameOver){
    for(let i=0; i < score; i++){
      document.querySelectorAll(`#${e}Bingo span`)[i].classList.add('set')
    }
  }
  // if won
  if(score === 5){
    finishGame(e);
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
      if(selected.length == target && unselected.length == 5 - target)
      return unselected[0];
    }
  }
  let num;
  do {
    num = Math.floor(Math.random() * 25) + 1; // pick 1–25
  } while (document.querySelector(`#ai-cell-${num}`).classList.contains('selected'));
  return `ai-cell-${num}`
}

// when a number is clicked
function cellClick(e){
  document.getElementById('numberOrder').disabled = true;

  const val = e.target.innerText;

  if(e.target.classList.contains('selected')){
    showAlert("error",`${val} was already selected. Choose a different number.`)
    return;
  }
  // mark selected number
  e.target.classList.add('selected');

  scoring('my');
  
  for(let i = 1; i<= 25; i++)
    document.getElementById(`my-cell-${i}`).disabled = true;

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
      
      // marking the ai selected number in client card
      let numV = document.querySelector(`#${cellNum}`).innerText;
      for(let i = 1; i<=25; i++){
        if(document.querySelector(`#my-cell-${i}`).innerText == numV){
          document.querySelector(`#my-cell-${i}`).classList.add('selected');
        }
      }

      scoring('ai');

      for(let i = 1; i<= 25; i++)
        document.getElementById(`my-cell-${i}`).disabled = false;
      }, 200);
  }else{
    if (socket && socket.connected){
      socket.emit("number-selected", user.room, val);
      for(let i=1; i<=25; i++)
        document.getElementById(`my-cell-${i}`).disabled = true;
      showAlert("msg",`You selected ${val}. It's ${user.partnerName}'s turn.`)
    }
  }
}

socket.on("myTurn", ()=>{
  for(let i=1; i<=25; i++){
    document.getElementById(`my-cell-${i}`).disabled = false;
  }
})

window.addEventListener('load', function() {

  setTimeout(function() {
    if(
    !(this.localStorage && localStorage.getItem("oldUser"))
  ){
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
  slideAndVanish("main-screen")
  document.getElementById("user-form").classList.remove("d-none");
  // document.getElementById("user-form").classList.add("drop-in");
  document.getElementById("user").focus()
}

function playAI(){
  slideAndVanish("main-screen");
  aiGame = true;
  createAiCard()
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

function showAlert(type,m){
  let alertB =  document.getElementById("alert-bar");
  alertB.classList.add(`${type}-alert`);
  alertB.classList.remove("d-none")
  document.getElementById("message").innerText=m;

  // setTimeout(() => {
  //   if(!( alertB.classList.contains("d-none") ))
  //     document.getElementById("alert-bar").classList.add("d-none")
  // }, 2000)
}

document.querySelector("#main-screen a").addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("intro-card").classList.remove("pop-out");
  document.getElementById("intro-card").classList.remove("d-none")
  document.getElementById("intro-card").classList.add("pop-in")
})

let loaderTimer = null;

function setLoader() {
  // Clear previous timer **before** resetting it
  if (loaderTimer) clearTimeout(loaderTimer);

  loaderTimer = setTimeout(() => {
    const loader = document.getElementById("loader");

    // If loader is still visible, show error
    if (!loader.classList.contains("d-none")) {
      gameRefresh();
      setTimeout(() => showAlert("error","Error occurred!"), 200)
      setTimeout(() => document.getElementById("alert-bar").classList.add("d-none"), 2000)
    }
  }, 20000); // or 10000 for 10 seconds

  // Now hide the loader (or do it earlier depending on flow)
  document.getElementById("loader").classList.remove("d-none");
}

function copyID() {
  var myId = document.getElementById("myID").innerText;
  navigator.clipboard.writeText(myId)
    .then(() => showAlert("msg","Copied"))
    .catch(err => showAlert("error", "Failed to copy: " + err));
}

function selectCardColor(color){
  document.getElementById('my').removeAttribute('class');
  document.getElementById("my").classList.add(color)
  document.getElementById("my").classList.add('bingo-card')
}

document.getElementById("color-close").addEventListener("click", () => {
    document.getElementById("color-card").classList.add("pop-out");
    setTimeout(()=> document.getElementById("color-card").classList.add("d-none"), 380);
})

function ShowColorCard(event){
  event.preventDefault();
  document.getElementById("color-card").classList.remove("pop-out");
  document.getElementById("color-card").classList.remove("d-none");
  document.getElementById("color-card").classList.add("pop-in");
}