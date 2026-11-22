(() => {
  const socket = io();
  const $ = id => document.getElementById(id);
  let roomCode = "", myId = "", roomState = null, x = 0, z = 0, moveTimer = null;
  let keys = {};
  const screens = ["home","lobby","game","results"];
  function show(id){ screens.forEach(s => $(s).classList.toggle("hidden",s!==id)); }
  function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800); }
  function name(){ return $("playerName").value.trim() || "Pemain"; }
  function setMessage(id,msg){ $(id).textContent=msg||""; }
  function enterRoom(data){ roomCode=data.code; myId=data.playerId; $("roomCodeDisplay").textContent=roomCode; $("gameRoom").textContent=roomCode; show("lobby"); }
  $("createBtn").onclick=()=>{setMessage("homeMessage","");socket.emit("createRoom",{name:name()},r=>r.ok?enterRoom(r):setMessage("homeMessage",r.error));};
  $("joinBtn").onclick=()=>{setMessage("homeMessage","");const code=$("roomCode").value.toUpperCase().trim();if(code.length!==5)return setMessage("homeMessage","Masukkan kode room 5 karakter.");socket.emit("joinRoom",{name:name(),code},r=>r.ok?enterRoom(r):setMessage("homeMessage",r.error));};
  $("roomCode").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5));
  $("copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(roomCode);toast("Kode room disalin.");}catch{toast("Kode: "+roomCode);}};
  $("startBtn").onclick=()=>socket.emit("startRound");
  $("leaveBtn").onclick=()=>{location.reload();};
  $("backLobbyBtn").onclick=()=>show("lobby");
  socket.on("connect",()=>{});
  socket.on("connect_error",()=>setMessage("homeMessage","Koneksi server gagal. Coba muat ulang halaman."));
  socket.on("notice",toast);
  socket.on("roomState",state=>{
    roomState=state;
    $("playerCount").textContent=state.players.length+"/10";
    $("playerList").innerHTML=state.players.map(p=>`<div class="player"><span class="dot" style="background:${p.color}"></span>${escapeHtml(p.name)} ${p.id===myId?"(Kamu)":""}</div>`).join("");
    $("lobbyHint").textContent=state.players.length<2?"Undang teman. Minimal 2 pemain untuk mulai.":"Pemain siap! Maksimal 10 pemain.";
    $("startBtn").disabled=state.players.length<2 || state.status==="playing";
    if(state.status==="playing") show("game");
    if(state.status==="waiting" && $("game").classList.contains("hidden")===false) show("lobby");
    renderScores(state.players);
    const me=state.players.find(p=>p.id===myId); if(me){$("myScore").textContent=me.score; x=me.x; z=me.z;}
    if(window.UPBGame)window.UPBGame.updatePlayers(state.players,myId);
  });
  socket.on("roundStarted",data=>{show("game");$("timer").textContent="01:30";if(window.UPBGame)window.UPBGame.updateCoins(data.coins);startMovement();});
  socket.on("coinsUpdate",coins=>window.UPBGame?.updateCoins(coins));
  socket.on("coinCollected",d=>{$("myScore").textContent=d.score;toast("+1 KOIN");});
  socket.on("roundEnded",data=>{
    stopMovement();$("ranking").innerHTML=data.ranking.map(p=>`<div class="rank-row"><span>${p.rank===1?"🏆":p.rank+". "+""}${escapeHtml(p.name)}</span><b>${p.score} koin</b></div>`).join("");
    show("results");
  });
  function renderScores(players){$("scoreList").innerHTML=[...players].sort((a,b)=>b.score-a.score).map(p=>`<span class="score-chip">${escapeHtml(p.name)}: <b>${p.score}</b></span>`).join("");}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function startMovement(){if(moveTimer)return;moveTimer=setInterval(()=>{let dx=0,dz=0;if(keys.up)dz-=1;if(keys.down)dz+=1;if(keys.left)dx-=1;if(keys.right)dx+=1;if(dx||dz){const len=Math.hypot(dx,dz);x=Math.max(-14,Math.min(14,x+dx/len*.34));z=Math.max(-14,Math.min(14,z+dz/len*.34));socket.emit("move",{x,z});}},50);}
  function stopMovement(){clearInterval(moveTimer);moveTimer=null;keys={};}
  document.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(k==="w"||k==="arrowup")keys.up=true;if(k==="s"||k==="arrowdown")keys.down=true;if(k==="a"||k==="arrowleft")keys.left=true;if(k==="d"||k==="arrowright")keys.right=true;});
  document.addEventListener("keyup",e=>{const k=e.key.toLowerCase();if(k==="w"||k==="arrowup")keys.up=false;if(k==="s"||k==="arrowdown")keys.down=false;if(k==="a"||k==="arrowleft")keys.left=false;if(k==="d"||k==="arrowright")keys.right=false;});
  document.querySelectorAll(".control").forEach(b=>{const d=b.dataset.dir;const on=e=>{e.preventDefault();keys[d]=true;};const off=e=>{e.preventDefault();keys[d]=false;};b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off);});
  socket.on("disconnect",()=>{if(roomCode)toast("Koneksi terputus. Mencoba menyambung kembali...");});
  socket.on("roomState",s=>{if(s.status==="finished")stopMovement();});
  // Server timer is authoritative; local display follows room state updates.
  socket.on("roomState",s=>{if(s.status==="playing")$("timer").textContent="00:"+String(s.secondsLeft).padStart(2,"0");});
})();
