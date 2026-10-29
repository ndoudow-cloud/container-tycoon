import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
const $=id=>document.getElementById(id);
const SAVE_KEY="container_tycoon_demo_v1";
const pool=[
{name:"Radio cổ",value:2200,condition:"Cần vệ sinh",icon:"📻"},
{name:"Máy ảnh film",value:4800,condition:"Cần sửa chữa",icon:"📷"},
{name:"Ghế gỗ",value:900,condition:"Cũ",icon:"🪑"},
{name:"Máy chơi game cầm tay",value:6200,condition:"Trầy nhẹ",icon:"🎮"},
{name:"Đồng hồ sưu tầm",value:8500,condition:"Chưa thẩm định",icon:"⌚"},
{name:"Loa bluetooth",value:1700,condition:"Hỏng nhẹ",icon:"🔊"},
{name:"Đèn bàn vintage",value:1300,condition:"Cũ",icon:"💡"},
{name:"Laptop cũ",value:5600,condition:"Cần sửa chữa",icon:"💻"},
{name:"Máy cassette",value:2700,condition:"Cũ",icon:"📼"},
{name:"Máy ảnh kỹ thuật số",value:3900,condition:"Trầy nhẹ",icon:"📸"}
];
let state=load()||{coins:15000,warehouse:[],shop:[],bought:[],player:{x:0,z:4},auctions:[]};
let activeTab="warehouse",keys=new Set(),moveTouch={x:0,z:0},scene,camera,renderer,avatar,lastMove=0;
function load(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))}catch{return null}}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function money(n){return Math.round(n||0).toLocaleString("vi-VN")}
function toast(t){let el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2600)}
function initAuctions(){
 if(state.auctions?.length)return;
 state.auctions=[
 {id:"A-01",start:1200,current:1200,title:"Container A-01",rarity:"Thường",desc:"Thùng hàng gia dụng",sold:false},
 {id:"B-07",start:2500,current:2500,title:"Container B-07",rarity:"Hiếm",desc:"Hàng điện tử lẫn đồ cũ",sold:false},
 {id:"C-12",start:5000,current:5000,title:"Container C-12",rarity:"Bí ẩn",desc:"Có thể lời lớn hoặc lỗ vốn",sold:false}
 ];save();
}
function init3D(){
 scene=new THREE.Scene();scene.background=new THREE.Color("#9bd5e3");scene.fog=new THREE.Fog("#9bd5e3",32,85);
 camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,150);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$("game").appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xe6faff,0x526b70,2.2));const sun=new THREE.DirectionalLight(0xfff0ce,2.2);sun.position.set(-12,25,14);sun.castShadow=true;scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:"#c5bba0",roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(100,18),new THREE.MeshStandardMaterial({color:"#3eafc5",roughness:.4}));water.rotation.x=-Math.PI/2;water.position.set(0,.02,-28);scene.add(water);
 const road=new THREE.Mesh(new THREE.BoxGeometry(42,.08,5),new THREE.MeshStandardMaterial({color:"#687b80"}));road.position.set(0,.05,0);scene.add(road);
 for(let i=0;i<7;i++){let l=new THREE.Mesh(new THREE.BoxGeometry(2,.1,.12),new THREE.MeshStandardMaterial({color:"#f5e7b0"}));l.position.set(-17+i*5.5,.12,0);scene.add(l)}
 const colors=["#df7658","#e8b84f","#468d9b","#597db0","#7b8e67","#c56c79"];
 for(let row=0;row<3;row++)for(let col=0;col<6;col++){let x=-14+col*5.6,z=-16+row*5.2,h=2.25+(col%3===0?1.4:0),c=colors[(row*3+col)%colors.length];let box=new THREE.Mesh(new THREE.BoxGeometry(4.8,h,3.5),new THREE.MeshStandardMaterial({color:c,roughness:.82}));box.position.set(x,h/2,z);box.castShadow=true;scene.add(box);for(let r=0;r<9;r++){let rib=new THREE.Mesh(new THREE.BoxGeometry(.055,h*.94,3.54),new THREE.MeshStandardMaterial({color:"#ffffff",transparent:true,opacity:.18}));rib.position.set(x-2.25+r*.56,h/2,z);scene.add(rib)}}
 const building=new THREE.Mesh(new THREE.BoxGeometry(12,5,8),new THREE.MeshStandardMaterial({color:"#e6e0cf"}));building.position.set(14,2.5,10);building.castShadow=true;scene.add(building);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(8,2,4),new THREE.MeshStandardMaterial({color:"#c65e48"}));roof.rotation.y=Math.PI/4;roof.position.set(14,6,10);roof.scale.set(1,.6,.75);scene.add(roof);
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.5,3,.15),new THREE.MeshStandardMaterial({color:"#344d60"}));door.position.set(14,1.5,5.9);scene.add(door);
 const craneMat=new THREE.MeshStandardMaterial({color:"#f0bd4b"});let beam=new THREE.Mesh(new THREE.BoxGeometry(1,15,1),craneMat);beam.position.set(19,7,-18);scene.add(beam);let arm=new THREE.Mesh(new THREE.BoxGeometry(12,.65,.65),craneMat);arm.position.set(14,14,-18);scene.add(arm);let leg=new THREE.Mesh(new THREE.BoxGeometry(1,10,1),craneMat);leg.position.set(9,5,-18);scene.add(leg);
 avatar=makeAvatar("#ffb84d");avatar.position.set(state.player.x,0,state.player.z);scene.add(avatar);
 addSign("CẢNG ĐẤU GIÁ",-5,3,-4);addSign("KHO CỦA BẠN",14,5,4);
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
 animate();
}
function makeAvatar(color){let g=new THREE.Group();let body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.7,4,8),new THREE.MeshStandardMaterial({color}));body.position.y=.85;body.castShadow=true;g.add(body);let head=new THREE.Mesh(new THREE.SphereGeometry(.31,16,12),new THREE.MeshStandardMaterial({color:"#f1c5a1"}));head.position.y=1.55;g.add(head);let cap=new THREE.Mesh(new THREE.SphereGeometry(.32,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:"#253e56"}));cap.position.y=1.75;g.add(cap);return g}
function addSign(text,x,y,z){let canvas=document.createElement("canvas");canvas.width=512;canvas.height=100;let ctx=canvas.getContext("2d");ctx.fillStyle="#18324c";ctx.roundRect(0,0,512,100,18);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 40px Arial";ctx.textAlign="center";ctx.fillText(text,256,64);let tex=new THREE.CanvasTexture(canvas);let mesh=new THREE.Mesh(new THREE.PlaneGeometry(5,1),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));mesh.position.set(x,y,z);scene.add(mesh)}
function animate(){requestAnimationFrame(animate);let f=(keys.has("w")||keys.has("arrowup")||moveTouch.z<0)?1:0,b=(keys.has("s")||keys.has("arrowdown")||moveTouch.z>0)?1:0,l=(keys.has("a")||keys.has("arrowleft")||moveTouch.x<0)?1:0,r=(keys.has("d")||keys.has("arrowright")||moveTouch.x>0)?1:0,dx=(r-l)*.13,dz=(b-f)*.13;if(dx||dz){avatar.position.x=Math.max(-20,Math.min(20,avatar.position.x+dx));avatar.position.z=Math.max(-23,Math.min(14,avatar.position.z+dz));avatar.rotation.y=Math.atan2(dx,dz);state.player={x:avatar.position.x,z:avatar.position.z};if(Date.now()-lastMove>700){save();lastMove=Date.now()}}camera.position.lerp(new THREE.Vector3(avatar.position.x,avatar.position.y+11,avatar.position.z+15),.08);camera.lookAt(avatar.position.x,avatar.position.y,avatar.position.z-2);renderer.render(scene,camera)}
function renderAuctions(){$("auctions").innerHTML=state.auctions.map(a=>`<div class="auction-card"><div class="auction-head"><strong>🚢 ${a.title}</strong><span class="badge">${a.rarity}</span></div><p>${a.desc}</p><div class="bid-row"><span>Giá hiện tại</span><b>${money(a.current)} xu</b></div><div class="bid-actions">${a.sold?`<button disabled>Đã mua</button>`:`<button data-bid="${a.id}" data-amt="${a.current+250}">Trả +250</button><button class="secondary" data-bid="${a.id}" data-amt="${a.current+1000}">+1.000</button>`}</div></div>`).join("");$("auctions").querySelectorAll("[data-bid]").forEach(b=>b.onclick=()=>bid(b.dataset.bid,+b.dataset.amt))}
function bid(id,amount){let a=state.auctions.find(x=>x.id===id);if(!a||a.sold)return;if(amount>state.coins){toast("Bà không đủ xu để trả giá!");return}if(!confirm(`Xác nhận mua ${a.title} với giá ${money(amount)} xu?`))return;state.coins-=amount;a.sold=true;let count=3+Math.floor(Math.random()*3),goods=[];for(let i=0;i<count;i++){let g=pool[Math.floor(Math.random()*pool.length)];goods.push({...g,uid:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),value:Math.max(100,Math.round(g.value*(.65+Math.random()*.8))),repaired:false})}state.warehouse.push(...goods);save();renderAll();showFound(goods);toast("Đấu giá thành công! Container đã được đưa về kho.")}
function renderInventory(){let arr=activeTab==="warehouse"?state.warehouse:state.shop;$("inventory").innerHTML=arr.length?arr.map(g=>`<div class="item-card"><div class="item-top"><div class="item-icon">${g.icon||"📦"}</div><div><strong>${g.name}</strong><small>${g.condition}${g.repaired?" · Đã tân trang":""}</small></div></div><div class="item-value">Ước tính ${money(g.value)} xu</div><div class="item-actions">${activeTab==="warehouse"?`<button data-repair="${g.uid}">🛠 Sửa · 350</button><button class="alt" data-list="${g.uid}">Đưa lên kệ</button>`:`<button data-sell="${g.uid}">Bán cho khách</button>`}</div></div>`).join(""):`<div class="empty">${activeTab==="warehouse"?"Kho đang trống.<br>Thắng một container để tìm hàng!":"Kệ chưa có món nào.<br>Đưa hàng từ kho lên kệ để bán."}</div>`;
$("inventory").querySelectorAll("[data-repair]").forEach(b=>b.onclick=()=>repair(b.dataset.repair));$("inventory").querySelectorAll("[data-list]").forEach(b=>b.onclick=()=>listItem(b.dataset.list));$("inventory").querySelectorAll("[data-sell]").forEach(b=>b.onclick=()=>sell(b.dataset.sell))}
function repair(uid){let g=state.warehouse.find(x=>x.uid===uid);if(!g)return;if(state.coins<350){toast("Không đủ xu để sửa!");return}state.coins-=350;g.value=Math.round(g.value*1.45);g.repaired=true;g.condition="Đã tân trang";save();renderAll();toast("Sửa xong! Giá trị món đồ tăng 45%.")}
function listItem(uid){let i=state.warehouse.findIndex(x=>x.uid===uid);if(i<0)return;state.shop.push(state.warehouse.splice(i,1)[0]);save();renderAll();toast("Đã đưa món đồ lên kệ.")}
function sell(uid){let i=state.shop.findIndex(x=>x.uid===uid);if(i<0)return;let g=state.shop.splice(i,1)[0],payout=Math.max(100,Math.round(g.value*(.8+Math.random()*.25)));state.coins+=payout;save();renderAll();toast(`Khách đã mua ${g.name}! +${money(payout)} xu`)}
function renderAll(){ $("coins").textContent=money(state.coins);$("owned").textContent=state.warehouse.length+state.shop.length;$("status").textContent="Demo offline · đã lưu trên thiết bị";renderAuctions();renderInventory()}
function showFound(goods){$("found-items").innerHTML=goods.map(g=>`<div class="found-item"><span>${g.icon} ${g.name}<br><small>${g.condition}</small></span><b>${money(g.value)} xu</b></div>`).join("");$("modal").classList.add("open")}
$("collect").onclick=()=>{$("modal").classList.remove("open");toast("Đã kiểm kê hàng và đưa vào kho!")};$("close-modal").onclick=()=>$("modal").classList.remove("open");
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));renderInventory()});
$("reset").onclick=()=>{if(confirm("Xóa tiến trình và chơi lại từ đầu?")){localStorage.removeItem(SAVE_KEY);location.reload()}};
addEventListener("keydown",e=>{let k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){keys.add(k);e.preventDefault()}});addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));addEventListener("blur",()=>keys.clear());
document.querySelectorAll("[data-move]").forEach(btn=>{let d=btn.dataset.move,v={forward:{x:0,z:-1},back:{x:0,z:1},left:{x:-1,z:0},right:{x:1,z:0}};let start=e=>{e.preventDefault();moveTouch=v[d]},stop=e=>{e.preventDefault();if(moveTouch===v[d])moveTouch={x:0,z:0}};btn.addEventListener("pointerdown",start);btn.addEventListener("pointerup",stop);btn.addEventListener("pointerleave",stop);btn.addEventListener("pointercancel",stop)});
initAuctions();init3D();renderAll();
