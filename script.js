const socket = io(
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://https://tempgame-production-9b23.up.railway.app'
);

const user = {}
socket.on("connect", () => {
  console.log("✅ Connected to server!", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
    
socket.on("number-received", val => selectNumber(val))

function selectNumber(number){   
  for(let i=1; i<=25; i++){
    document.getElementById(`my-cell-${i}`).disabled = false;
    if(document.getElementById(`my-cell-${i}`).innerText === number)
      document.getElementById(`my-cell-${i}`).classList.add('selected')
    }
  }

function registerUser(event){
    event.preventDefault()
    user.name = document.getElementById("user").value;
    if(socket.connected)
      socket.emit("register", user.name);
    document.getElementById("user-form").classList.add("d-none")
    document.getElementById("loader").classList.remove("d-none")
}

socket.on("yourID", (id) => {
  document.getElementById("myID").innerText = id;
  user.id = id;
  document.getElementById("connect-form").classList.remove("d-none")
  document.getElementById("loader").classList.add("d-none")
})


function connectUser(event){
  event.preventDefault();
  let pId = document.getElementById("id").value;
  document.getElementById("connect-form").classList.add("d-none")
  document.getElementById("loader").classList.remove("d-none")
  socket.emit("askConnection", user.id, pId);
}

socket.on("connectionRequest", (pid, pname) => {
  document.getElementById("loader").classList.add("d-none");
  document.getElementById("pName").innerText = pname;
  document.getElementById("pName").setAttribute("data-info", pid);
  document.getElementById("permission-form").classList.remove("d-none");
});


function connectPartner(event, res){
  event.preventDefault();
  document.getElementById("permission-form").classList.add("d-none");
  document.getElementById("loader").classList.remove("d-none");
  let pId = document.getElementById("pName").getAttribute("data-info")
  if(res === "yes")
    socket.emit("connectWith", pId)
}

socket.on("room-connected", (room, uName, pName) => {
  user.room = room
  document.getElementById("loader").classList.add("d-none");
  document.getElementById("connect-form").classList.add("d-none");
  console.log("my Name:", uName, "yourName:", pName)
})

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
    socket.emit("finished", user.room)
  }
  else{
    document.querySelector('.result #result-data').innerText = "OOPS, YOU LOSE...👎";
  }
}

function gameRefresh(){
  gameOver = false;
  document.querySelector('.result').classList.add('d-none');
  document.getElementById('numberOrder').disabled = false;
  renderGame('my');
}

function scoring(e){
  let s = 'my';

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
// when a number is clicked
function cellClick(e){
  document.getElementById('numberOrder').disabled = true;

  const val = e.target.innerText;

  if(e.target.classList.contains('selected')){
    alert('already selected')
    return;
  }
  // mark selected number
  e.target.classList.add('selected');
  
  scoring('my');
  
  for(let i = 1; i<= 25; i++)
    document.getElementById(`my-cell-${i}`).disabled = true;


  if (socket && socket.connected){
  socket.emit("number-selected", user.room, val)
  }
}
window.addEventListener('load', function() {
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

