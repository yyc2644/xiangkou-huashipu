(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function r(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(a){if(a.ep)return;a.ep=!0;const o=r(a);fetch(a.href,o)}})();const y=(t,e,r,s)=>e.map((a,o)=>({id:`${t}_${o+1}`,chain:t,level:o+1,name:a,icon:r[o],color:s[o],next:o<e.length-1?`${t}_${o+2}`:void 0,sell:2+o*4})),K=[...y("greens",["菜叶","小青菜","鲜青菜","菜心","精品菜心"],["leaf","sprout","greens","bok","jade"],["#c7e8a6","#9fdc78","#75c45d","#4aa956","#25834b"]),...y("tomato",["小番茄","红番茄","甜番茄","番茄篮","精品番茄篮"],["dot","tomato","sweet","tomato_basket","tomato_crate"],["#ffd0c7","#ff9b8d","#f76f66","#e95652","#c83f46"]),...y("egg",["鸡蛋","双黄蛋","蛋篮","鲜蛋盒","精品蛋盒"],["egg","double","basket","box","goldbox"],["#fff0bc","#ffe08a","#f7c96c","#dfad4f","#bd8f36"]),...y("wheat",["小麦","面粉","面团","发酵面团","精品面团"],["wheat","flour","dough","rise","soft"],["#f6dda3","#e9c87b","#dcb163","#c8954b","#a87939"]),...y("daisy",["花芽","小雏菊","雏菊束","雏菊花篮","精品雏菊篮"],["bud","daisy","bunch","florist","goldflower"],["#fff3a9","#f9e779","#e6d24f","#cfba34","#ab9824"]),...y("rose",["玫瑰苗","玫瑰","玫瑰束","玫瑰花盒","精品玫瑰礼盒"],["rosebud","rose","roses","rosebox","royal"],["#ffd1df","#ff9fbc","#f06e9b","#d84f83","#b7336b"]),...y("box",["纸片","纸盒","礼盒","精致礼盒","高级礼盒"],["paper","box","gift","ribbonbox","luxury"],["#f6ead5","#e7d4b2","#d3b485","#b88d5d","#926b45"]),...y("ribbon",["细绳","丝带","蝴蝶结","花结","高级花结"],["line","ribbon","bow","flowerbow","silk"],["#d6f0ff","#9edbf5","#67c3e7","#3da7cc","#2389ac"]),{id:"dish_bao",chain:"dish",level:1,name:"青菜包",icon:"bao",color:"#f3f0d3",sell:40},{id:"dish_egg",chain:"dish",level:1,name:"番茄煎蛋",icon:"panegg",color:"#ffbd63",sell:48},{id:"dish_pancake",chain:"dish",level:1,name:"香草蛋饼",icon:"pancake",color:"#d2c77a",sell:56},{id:"gift_morning",chain:"gift",level:1,name:"清晨花礼",icon:"morninggift",color:"#f6de7c",sell:70},{id:"gift_lunch",chain:"gift",level:1,name:"暖心便当",icon:"bento",color:"#f3a76d",sell:74},{id:"gift_rose",chain:"gift",level:1,name:"玫瑰甜点盒",icon:"rosegift",color:"#ef8baa",sell:92}],d=Object.fromEntries(K.map(t=>[t.id,t])),C=[{id:"veg_basket",name:"菜篮",icon:"veg",color:"#79bf68",drops:["greens_1","tomato_1","egg_1","wheat_1"],maxCharges:20,cooldownMs:300*1e3},{id:"flower_basket",name:"花篮",icon:"flower",color:"#df8fab",drops:["daisy_1","rose_1"],maxCharges:16,cooldownMs:300*1e3},{id:"market_crate",name:"杂货箱",icon:"crate",color:"#b98a5e",drops:["box_1","ribbon_1","box_1"],maxCharges:14,cooldownMs:360*1e3}],w={steamer:"蒸锅",pan:"煎台",gift_table:"礼盒台"},S=[{id:"recipe_bao",name:"青菜包",cooker:"steamer",icon:"bao",color:"#ece5bc",inputs:["wheat_3","greens_3"],output:"dish_bao",durationMs:90*1e3},{id:"recipe_egg",name:"番茄煎蛋",cooker:"pan",icon:"panegg",color:"#ffbd63",inputs:["egg_2","tomato_2"],output:"dish_egg",durationMs:120*1e3},{id:"recipe_pancake",name:"香草蛋饼",cooker:"pan",icon:"pancake",color:"#d2c77a",inputs:["egg_3","daisy_2"],output:"dish_pancake",durationMs:150*1e3},{id:"recipe_morning_gift",name:"清晨花礼",cooker:"gift_table",icon:"morninggift",color:"#f6de7c",inputs:["daisy_3","box_2","ribbon_1"],output:"gift_morning",durationMs:180*1e3},{id:"recipe_lunch",name:"暖心便当",cooker:"gift_table",icon:"bento",color:"#f3a76d",inputs:["greens_3","egg_3","box_2"],output:"gift_lunch",durationMs:210*1e3},{id:"recipe_rose_gift",name:"玫瑰甜点盒",cooker:"gift_table",icon:"rosegift",color:"#ef8baa",inputs:["rose_3","wheat_3","box_3"],output:"gift_rose",durationMs:240*1e3}],Ue=[{id:"lin",name:"林阿姨",avatar:"neighbor",role:"老街邻居",color:"#e6a768",story:["这家小铺以前一到清晨就有蒸汽。","你做的青菜包，味道有点像从前。","门头亮起来了，巷子也像醒了一点。"]},{id:"xiaoman",name:"小满",avatar:"student",role:"放学路过的小学生",color:"#7eb6d9",story:["我想给妈妈带一份好看的小礼物。","她今天加班，我想让她开心一下。","妈妈说，下次也想来店里坐坐。"]},{id:"acheng",name:"阿诚",avatar:"coder",role:"加班程序员",color:"#6b8fbc",story:["今晚又要赶需求，能做点热的吗？","番茄煎蛋救了我半条命。","我给你写了个自动算账小工具，别嫌简陋。"]},{id:"shen",name:"沈爷爷",avatar:"gardener",role:"退休花匠",color:"#83a46a",story:["花架空着可惜，我带了些旧花盆。","花要慢慢养，人也是。","这条巷子终于又有香气了。"]},{id:"qiao",name:"乔小姐",avatar:"planner",role:"婚礼策划师",color:"#cc779b",story:["我需要一份不浮夸但很用心的花礼。","新娘说它像清晨的第一束光。","下个月，我想把你的小铺写进推荐名单。"]},{id:"zhou",name:"老周",avatar:"courier",role:"快递站老板",color:"#b48358",story:["快递站人多，大家总忘记吃饭。","你的便当一到，屋里都安静了。","以后巷口的午饭，就拜托你了。"]}],de=[{id:"order_001",title:"街坊早餐",customerId:"lin",story:!1,needs:["greens_2","egg_2"],coin:80,xp:10,storyPoints:0},{id:"order_002",title:"清爽菜篮",customerId:"shen",story:!1,needs:["greens_3","tomato_2"],coin:105,xp:12,storyPoints:0},{id:"order_003",title:"放学点心",customerId:"xiaoman",story:!1,needs:["wheat_2","daisy_2"],coin:120,xp:14,storyPoints:0},{id:"order_004",title:"加班夜宵",customerId:"acheng",story:!1,needs:["dish_egg"],coin:180,xp:18,storyPoints:0},{id:"order_005",title:"旧花盆整理",customerId:"shen",story:!1,needs:["daisy_3","box_2"],coin:150,xp:16,storyPoints:0},{id:"order_006",title:"伴手礼试做",customerId:"qiao",story:!1,needs:["box_3","ribbon_2"],coin:155,xp:16,storyPoints:0},{id:"order_007",title:"热腾腾包子",customerId:"lin",story:!0,needs:["dish_bao"],coin:230,xp:22,storyPoints:1},{id:"order_008",title:"给妈妈的花",customerId:"xiaoman",story:!0,needs:["gift_morning"],coin:260,xp:24,storyPoints:1},{id:"order_009",title:"程序员续命餐",customerId:"acheng",story:!0,needs:["dish_egg","tomato_3"],coin:280,xp:25,storyPoints:1},{id:"order_010",title:"花架重开",customerId:"shen",story:!0,needs:["daisy_3","rose_2"],coin:240,xp:24,storyPoints:1},{id:"order_011",title:"婚礼清晨花礼",customerId:"qiao",story:!0,needs:["gift_morning","rose_3"],coin:340,xp:32,storyPoints:2},{id:"order_012",title:"快递站午饭",customerId:"zhou",story:!0,needs:["gift_lunch"],coin:360,xp:34,storyPoints:2},{id:"order_013",title:"精致礼盒单",customerId:"qiao",story:!1,needs:["gift_rose"],coin:420,xp:38,storyPoints:0},{id:"order_014",title:"巷口大份餐",customerId:"zhou",story:!1,needs:["dish_bao","dish_pancake"],coin:390,xp:35,storyPoints:0}],k=Object.fromEntries(de.map(t=>[t.id,t])),ue=Object.fromEntries(S.map(t=>[t.id,t])),Fe=Object.fromEntries(C.map(t=>[t.id,t])),Y=Object.fromEntries(Ue.map(t=>[t.id,t])),pe=[{id:"signboard",name:"门头",levels:[{level:1,title:"褪色木牌",coinCost:0,storyCost:0,effect:"小店刚刚重开"},{level:2,title:"新刷招牌",coinCost:300,storyCost:0,effect:"门口更醒目，街坊更容易找到小店"},{level:3,title:"暖灯门头",coinCost:800,storyCost:2,effect:"夜里也亮着暖灯，小店更有开张感"}]},{id:"tables",name:"餐桌",levels:[{level:1,title:"旧木桌",coinCost:0,storyCost:0,effect:"能接待路过街坊"},{level:2,title:"干净小桌",coinCost:280,storyCost:0,effect:"桌面清爽，顾客坐下更安心"},{level:3,title:"靠窗花桌",coinCost:760,storyCost:2,effect:"窗边有花，小店更有停留感"}]},{id:"flower_shelf",name:"花架",levels:[{level:1,title:"空花架",coinCost:0,storyCost:0,effect:"等着重新摆满鲜花"},{level:2,title:"晨光花架",coinCost:360,storyCost:1,effect:"晨光下有了第一排花"},{level:3,title:"满架花香",coinCost:900,storyCost:3,effect:"花香铺满门口，路人会多看一眼"}]},{id:"kitchen",name:"后厨",levels:[{level:1,title:"小灶台",coinCost:0,storyCost:0,effect:"能做基础热食"},{level:2,title:"整洁后厨",coinCost:420,storyCost:1,effect:"锅具和台面都收拾顺手了"},{level:3,title:"高效后厨",coinCost:1e3,storyCost:3,effect:"动线更顺，看起来像完整小厨房"}]}],v=[{id:"take_material",scope:"onboarding",title:"取一次材料",desc:"点菜篮、花篮或杂货箱。",rewardLabel:"+5 体力",reward:{energy:5}},{id:"merge_greens",scope:"onboarding",title:"合成小青菜",desc:"把两片菜叶合成 Lv.2。",rewardLabel:"+10 金币",reward:{coins:10}},{id:"complete_breakfast",scope:"onboarding",title:"完成街坊早餐",desc:"提交林阿姨的第一单。",rewardLabel:"+10 体力",reward:{energy:10}},{id:"start_bao",scope:"onboarding",title:"开始制作青菜包",desc:"凑齐面团和鲜青菜后开蒸锅。",rewardLabel:"+15 金币",reward:{coins:15}},{id:"complete_bao_story",scope:"onboarding",title:"完成热腾腾包子",desc:"交付青菜包，拿故事点。",rewardLabel:"+15 体力",reward:{energy:15}},{id:"upgrade_signboard",scope:"onboarding",title:"修一次门头",desc:"用金币让小店更像开张。",rewardLabel:"+10 经验",reward:{xp:10}}],L=[{id:"daily_materials",scope:"daily",title:"补齐食材",desc:"今天取材 8 次。",target:8,rewardLabel:"+12 体力",reward:{energy:12}},{id:"daily_merges",scope:"daily",title:"整理货架",desc:"今天完成 6 次合成。",target:6,rewardLabel:"+25 金币",reward:{coins:25}},{id:"daily_orders",scope:"daily",title:"招待街坊",desc:"今天完成 1 份订单。",target:1,rewardLabel:"+15 经验",reward:{xp:15}}];Object.fromEntries(v.map(t=>[t.id,t]));const fe=Object.fromEntries(L.map(t=>[t.id,t])),be=t=>{const e=new Date(t),r=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return`${e.getFullYear()}-${r}-${s}`},re=(t,e)=>t.board.filter(r=>r?.itemId===e).length,z=(t,e)=>{const r=t.milestones??{};switch(e){case"take_material":return!!r.take_material;case"merge_greens":return!!r.merge_greens||re(t,"greens_2")>0||t.completedOrders.includes("order_001");case"complete_breakfast":return!!r.complete_breakfast||t.completedOrders.includes("order_001");case"start_bao":return!!r.start_bao||t.cookers.steamer.recipeId==="recipe_bao"||re(t,"dish_bao")>0||t.completedOrders.includes("order_007");case"complete_bao_story":return!!r.complete_bao_story||t.completedOrders.includes("order_007");case"upgrade_signboard":return!!r.upgrade_signboard||t.shop.signboard>=2;default:return!1}},J=(t,e)=>{const r=fe[e]?.target??0;switch(e){case"daily_materials":return t.dailyProgress.materials>=r;case"daily_merges":return t.dailyProgress.merges>=r;case"daily_orders":return t.dailyProgress.orders>=r}},he=(t,e)=>{if(e.scope==="onboarding")return{current:z(t,e.id)?1:0,target:1};switch(e.id){case"daily_materials":return{current:t.dailyProgress.materials,target:e.target??0};case"daily_merges":return{current:t.dailyProgress.merges,target:e.target??0};case"daily_orders":return{current:t.dailyProgress.orders,target:e.target??0}}},G=(t,e)=>e.scope==="onboarding"?z(t,e.id):J(t,e.id),$=(t,e,r="onboarding")=>r==="onboarding"?(t.claimedTaskIds??[]).includes(e):t.dailyClaimedTaskIds.includes(e),Ve=t=>v.filter(e=>!$(t,e.id,"onboarding")),He=t=>v.filter(e=>z(t,e.id)&&!$(t,e.id,"onboarding")),Ke=t=>L.filter(e=>!$(t,e.id,"daily")),Ye=t=>L.filter(e=>J(t,e.id)&&!$(t,e.id,"daily")),Je=63,se=180*1e3,Z=16,ae=[["greens_1","greens_1",null,null,"tomato_1",null,"egg_1",null,null,"wheat_1",null,null,null,null,null,null],["greens_2",null,null,null,"tomato_1","tomato_1",null,null,null,"wheat_1",null,null,null,null,null,null],["greens_2","egg_2",null,null,"tomato_1","wheat_1","wheat_1",null,null,null,"daisy_1",null,null,null,null,null],["greens_2","egg_2","wheat_2","daisy_1","box_1","ribbon_1",null,null,null,null,null,null,null,null,null,null]],T=t=>(ae[Math.max(0,Math.min(ae.length-1,t))]??[]).slice(0,Z).map((e,r)=>e?{uid:`tutorial-${t}-${r}`,itemId:e}:null),Ze=t=>{const e=Array(Je).fill(null),r=["greens_1","greens_1","tomato_1","egg_1","wheat_1","daisy_1","box_1","ribbon_1"];return r.forEach((s,a)=>{e[a]={uid:`item-${a+1}`,itemId:s}}),{saveVersion:5,nextUid:r.length+1,board:e,generators:{veg_basket:{id:"veg_basket",charges:20,readyAt:t},flower_basket:{id:"flower_basket",charges:16,readyAt:t},market_crate:{id:"market_crate",charges:14,readyAt:t}},cookers:{steamer:{id:"steamer"},pan:{id:"pan"},gift_table:{id:"gift_table"}},activeOrders:["order_001","order_002"],completedOrders:[],viewedStories:[],shop:{signboard:1,tables:1,flower_shelf:1,kitchen:1},coins:260,energy:80,maxEnergy:80,xp:0,level:1,storyPoints:0,lastEnergyAt:t,message:"林阿姨推开门：先从一份热腾腾的早餐开始吧。",trackedTaskId:"take_material",trackedTaskScope:"onboarding",claimedTaskIds:[],dayKey:be(t),dailyProgress:{materials:0,merges:0,orders:0},dailyClaimedTaskIds:[],tutorial:{step:0,open:!0,completed:!1,board:T(0),actionDone:!1},milestones:{}}},f=t=>({...t,board:t.board.map(e=>e?{...e}:null),generators:{veg_basket:{...t.generators.veg_basket},flower_basket:{...t.generators.flower_basket},market_crate:{...t.generators.market_crate}},cookers:{steamer:{...t.cookers.steamer},pan:{...t.cookers.pan},gift_table:{...t.cookers.gift_table}},activeOrders:[...t.activeOrders],completedOrders:[...t.completedOrders],viewedStories:[...t.viewedStories],shop:{...t.shop},trackedTaskId:t.trackedTaskId,claimedTaskIds:[...t.claimedTaskIds??[]],dailyProgress:{...t.dailyProgress},dailyClaimedTaskIds:[...t.dailyClaimedTaskIds],tutorial:t.tutorial?{...t.tutorial,board:t.tutorial.board?.map(e=>e?{...e}:null)}:void 0,milestones:{...t.milestones??{}},pendingStory:t.pendingStory?{...t.pendingStory}:void 0}),D=t=>`item-${t.nextUid++}`,x=(t,e)=>{t.milestones={...t.milestones??{},[e]:!0}},We=t=>t.findIndex(e=>!e),ge=(t,e)=>{const r=We(t.board);return r===-1?(t.message="棋盘满了，先合成或出售一些低级物品。",!1):(t.board[r]={uid:D(t),itemId:e},!0)},W=(t,e)=>{t.dailyProgress={...t.dailyProgress,[e]:t.dailyProgress[e]+1}},Xe=(t,e)=>{const r=be(e);return t.dayKey===r?!1:(t.dayKey=r,t.dailyProgress={materials:0,merges:0,orders:0},t.dailyClaimedTaskIds=[],v.every(s=>$(t,s.id,"onboarding"))&&(t.trackedTaskScope="daily",t.trackedTaskId="daily_materials"),t.message="新一天开张了，今日委托已刷新。",!0)},me=(t,e)=>{const r=[];for(const s of e){const a=t.board.findIndex((o,n)=>o?.itemId===s&&!r.includes(n));if(a===-1)return!1;r.push(a)}return r.forEach(s=>{t.board[s]=null}),!0},j=(t,e)=>t.board.filter(r=>r?.itemId===e).length,q=(t,e)=>e.every((r,s)=>j(t,r)>=e.slice(0,s+1).filter(a=>a===r).length),ye=(t,e)=>{let r=!1;const s=f(t);if(r=Xe(s,e)||r,s.energy<s.maxEnergy){const a=Math.floor((e-s.lastEnergyAt)/se);a>0&&(s.energy=Math.min(s.maxEnergy,s.energy+a),s.lastEnergyAt+=a*se,r=!0)}else s.lastEnergyAt!==e&&(s.lastEnergyAt=e,r=!0);for(const a of C){const o=s.generators[a.id];o.charges<=0&&e>=o.readyAt&&(o.charges=Math.ceil(a.maxCharges/2),s.message=`${a.name}补好货了，可以继续取材。`,r=!0)}return r?s:t},Qe=(t,e,r)=>{const s=f(t),a=Fe[e],o=s.generators[e];if(s.energy<=0)return s.message="体力不够了，可以稍等恢复，或在正式版看激励广告补充。",s;if(o.charges<=0){const l=Math.max(0,Math.ceil((o.readyAt-r.nowMs)/1e3));return s.message=l>0?`${a.name}还要 ${l} 秒补货。`:`${a.name}正在补货。`,s}const n=a.drops[Math.floor(r.random()*a.drops.length)];return ge(s,n)&&(x(s,"take_material"),W(s,"materials"),s.guidedGeneratorId=void 0,s.energy===s.maxEnergy&&(s.lastEnergyAt=r.nowMs),s.energy-=1,o.charges-=1,o.charges===0&&(o.readyAt=r.nowMs+a.cooldownMs),s.message=`${a.name}产出了 ${d[n].name}。`),s},oe=(t,e)=>{const r=f(t),s=r.selectedCell;return s===void 0?(r.board[e]&&(r.selectedCell=e,r.message=`选中了 ${d[r.board[e].itemId].name}。`),r):s===e?(r.selectedCell=void 0,r):et(r,s,e)},et=(t,e,r)=>{const s=f(t),a=s.board[e],o=s.board[r];if(!a)return s.selectedCell=void 0,s;if(!o)return s.board[r]=a,s.board[e]=null,s.selectedCell=void 0,s.message=`移动了 ${d[a.itemId].name}。`,s;if(a.itemId===o.itemId&&d[a.itemId].next){const n=d[a.itemId].next;return s.board[r]={uid:D(s),itemId:n},s.board[e]=null,s.selectedCell=void 0,W(s,"merges"),s.message=`${d[a.itemId].name} 合成了 ${d[n].name}。`,n==="greens_2"&&x(s,"merge_greens"),s}return s.selectedCell=r,s.message="这两个物品不能合成。",s},tt=(t,e)=>{const r=f(t),s=r.board[e];if(!s)return r;const a=d[s.itemId];return r.board[e]=null,r.coins+=a.sell,r.selectedCell=void 0,r.message=`出售 ${a.name}，获得 ${a.sell} 金币。`,r},rt=(t,e,r)=>{const s=ue[e],a=f(t),o=a.cookers[s.cooker];return o.recipeId?(a.message="制作台正忙，等完成后再开新单。",a):q(a,s.inputs)?(me(a,s.inputs),o.recipeId=s.id,o.readyAt=r+s.durationMs,o.output=s.output,a.guidedRecipeId=void 0,a.message=`${s.name} 开始制作，等香气出来就能收取。`,s.id==="recipe_bao"&&x(a,"start_bao"),a):(a.message=`${s.name} 材料还没凑齐。`,a)},st=(t,e,r)=>{const s=f(t),a=s.cookers[e];if(!a.recipeId||!a.output||!a.readyAt)return s.message="这个制作台现在是空的。",s;if(r<a.readyAt)return s.message="还没做好，可以稍等，正式版这里会接激励广告加速。",s;if(!ge(s,a.output))return s;const o=ue[a.recipeId];return s.cookers[e]={id:e},s.message=`${o.name} 做好了，已经放到棋盘上。`,o.output==="dish_bao"&&x(s,"collect_bao"),s},at=t=>de.find(e=>!t.activeOrders.includes(e.id)&&!t.completedOrders.includes(e.id))?.id,ot=(t,e)=>{const r=k[e],s=f(t);if(!r||!s.activeOrders.includes(e))return s.message="这张订单还没有接到，先完成当前订单吧。",s;if(!q(s,r.needs))return s.message="订单物品还没准备好。",s;if(me(s,r.needs),s.coins+=r.coin,s.xp+=r.xp,s.storyPoints+=r.storyPoints,s.completedOrders.push(r.id),s.activeOrders=s.activeOrders.filter(n=>n!==r.id),W(s,"orders"),r.id==="order_001"&&x(s,"complete_breakfast"),r.id==="order_007"&&x(s,"complete_bao_story"),r.story){const n=`${r.customerId}:${r.id}`,l=s.completedOrders.filter(u=>k[u]?.customerId===r.customerId&&k[u]?.story).length,i=Y[r.customerId]?.story[Math.max(0,Math.min(2,l-1))];s.pendingStory={orderId:r.id,customerId:r.customerId,chapter:Math.max(1,Math.min(3,l)),line:i??"谢谢你，这份心意我收到了。"},s.viewedStories.includes(n)||s.viewedStories.push(n)}const a=at(s);a&&s.activeOrders.length<4&&s.activeOrders.push(a);const o=Math.floor(s.xp/100)+1;return o>s.level?(s.level=o,s.energy=s.maxEnergy,s.message=`完成「${r.title}」，小店等级升到 ${s.level}，体力回满了。`):s.message=`完成「${r.title}」，获得 ${r.coin} 金币。`,s},lt=(t,e)=>{const r=f(t),s=r.shop[e],a=pe.find(n=>n.id===e),o=a?.levels.find(n=>n.level===s+1);return!a||!o?(r.message="这个区域已经是 MVP 最高级了。",r):r.coins<o.coinCost||r.storyPoints<o.storyCost?(r.message=`升级${a.name}需要 ${o.coinCost} 金币和 ${o.storyCost} 故事点。`,r):(r.coins-=o.coinCost,r.storyPoints-=o.storyCost,r.shop[e]=o.level,r.message=`${a.name}升级为「${o.title}」：${o.effect}`,e==="signboard"&&o.level>=2&&x(r,"upgrade_signboard"),r)},nt=t=>{const e=f(t);return e.energy=Math.min(e.maxEnergy,e.energy+30),e.message="模拟激励广告完成：体力 +30。",e},it=(t,e,r="onboarding")=>{const s=f(t);return s.trackedTaskId=e,s.trackedTaskScope=r,s.message="已更新追踪任务。",s},ct=(t,e,r="onboarding")=>{const s=r==="onboarding"?v.find(l=>l.id===e):fe[e],a=f(t);if(!s)return a.message="这个任务不存在。",a;if(!(r==="onboarding"?z(a,e):J(a,e)))return a.message="任务还没完成，先按追踪目标做一步。",a;if($(a,e,r))return a.message="这个任务奖励已经领过了。",a;const n=s.reward;return a.coins+=n.coins??0,a.energy=Math.min(a.maxEnergy,a.energy+(n.energy??0)),a.xp+=n.xp??0,a.storyPoints+=n.storyPoints??0,a.level=Math.floor(a.xp/100)+1,r==="onboarding"?(a.claimedTaskIds=[...a.claimedTaskIds??[],e],v.every(l=>$(a,l.id,"onboarding"))&&(a.trackedTaskScope="daily",a.trackedTaskId="daily_materials")):a.dailyClaimedTaskIds=[...a.dailyClaimedTaskIds,e],a.message=`领取「${s.title}」奖励：${s.rewardLabel}。`,a},dt=(t,e)=>{const r=f(t),s=r.tutorial??{step:0,open:!0,completed:!1},a=s.board?.length===Z?s.board:T(s.step),o=s.selectedCell;if(o===void 0)return a[e]&&(r.tutorial={...s,board:a,selectedCell:e},r.message=`选中了 ${d[a[e].itemId].name}。`),r;if(o===e)return r.tutorial={...s,board:a,selectedCell:void 0},r;const n=a[o],l=a[e];if(!n)return r.tutorial={...s,board:a,selectedCell:void 0},r;if(!l)return a[e]=n,a[o]=null,r.tutorial={...s,board:a,selectedCell:void 0},r.message=`移动了 ${d[n.itemId].name}。`,r;if(n.itemId===l.itemId&&d[n.itemId].next){const i=d[n.itemId].next;return a[e]={uid:D(r),itemId:i},a[o]=null,r.tutorial={...s,board:a,selectedCell:void 0,actionDone:!0},r.message=`${d[n.itemId].name} 合成了 ${d[i].name}。`,r}return r.tutorial={...s,board:a,selectedCell:e},r.message="这两个材料不能合成，换一组相同的试试。",r},ut=t=>{const e=f(t),r=e.tutorial??{step:1,open:!0,completed:!1},s=r.board?.length===Z?r.board:T(r.step),a=s.findIndex(o=>!o);return a===-1?(e.tutorial={...r,board:s,actionDone:!0},e.message="教学棋盘满了，可以先合成或继续下一步。",e):(s[a]={uid:D(e),itemId:"greens_1"},e.tutorial={...r,board:s,selectedCell:void 0,actionDone:!0},e.message="菜篮产出了一片菜叶。",e)},pt=t=>{const e=f(t),r=e.tutorial??{step:2,open:!0,completed:!1};return e.tutorial={...r,actionDone:!0,selectedCell:void 0},e.message="已追踪街坊早餐，正式游戏里订单会放在入口里。",e},le=(t,e)=>{const r=f(t),s=Math.max(0,Math.min(3,e));return r.tutorial={step:s,open:!0,completed:!1,board:T(s),selectedCell:void 0,actionDone:s===3,resumeAvailable:r.tutorial?.resumeAvailable},r},ft=t=>{const e=f(t);return e.tutorial={step:3,open:!1,completed:!0,board:T(3),selectedCell:void 0,actionDone:!0,resumeAvailable:!1},e.selectedCell=void 0,e.message="教学完成，正式开张。先从街坊早餐开始吧。",e},bt=t=>{const e=f(t);return e.tutorial={step:0,open:!0,completed:!1,board:T(0),selectedCell:void 0,actionDone:!1,resumeAvailable:!0},e.selectedCell=void 0,e.message="重新进入新手教学。",e},ht=t=>{const e=f(t);return e.tutorial?.resumeAvailable&&(e.tutorial={...e.tutorial,completed:!0,open:!1,selectedCell:void 0},e.message="已回到小店，原有进度没有变化。"),e},gt=t=>{const e=f(t);return e.pendingStory=void 0,e},mt=(t,e)=>{const r=f(t);return r.atlasFocusItemId=e,r.message=`已定位「${d[e].name}」的来源。`,r},yt=(t,e)=>{const r=f(t),s=S.find(l=>l.output===e);if(r.atlasFocusItemId=e,r.guidedGeneratorId=void 0,r.guidedRecipeId=void 0,s)return r.guidedRecipeId=s.id,r.message=`已定位${s.name}和${s.cooker==="steamer"?"蒸锅":s.cooker==="pan"?"煎台":"礼盒台"}。`,r;const a=d[e],o=Object.values(d).find(l=>l.chain===a.chain&&l.level===1),n=C.find(l=>o&&l.drops.includes(o.id));return n?(r.guidedGeneratorId=n.id,r.message=`已定位${n.name}，从这里开始取材。`):r.message="这个材料暂时没有可用来源。",r},X="xiangkou-huashipu-save-v5",ke="xiangkou-huashipu-save-v4",Q={getItem:t=>window.localStorage.getItem(t),setItem:(t,e)=>window.localStorage.setItem(t,e),removeItem:t=>window.localStorage.removeItem(t)},kt=t=>{const e=new Date(t);return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`},vt=t=>{const e=[...t.board??[],...t.tutorial?.board??[]].flatMap(r=>r?[Number(r.uid.replace(/^item-/,""))]:[]).filter(Number.isFinite);return Math.max(1,...e)+1},$t=(t,e)=>{if(!t||typeof t!="object")return null;const r=t;return!Array.isArray(r.board)||!r.generators||!r.cookers||!r.shop?null:{...r,saveVersion:5,nextUid:r.nextUid??vt(r),message:"",claimedTaskIds:[...r.claimedTaskIds??[]],trackedTaskScope:r.trackedTaskScope??"onboarding",dayKey:r.dayKey??kt(e),dailyProgress:r.dailyProgress??{materials:0,merges:0,orders:0},dailyClaimedTaskIds:[...r.dailyClaimedTaskIds??[]],atlasFocusItemId:void 0,guidedGeneratorId:void 0,guidedRecipeId:void 0}},_t=(t,e=Q)=>{try{const r=e.getItem(X)??e.getItem(ke);return r?$t(JSON.parse(r),t):null}catch{return null}},wt=(t,e=Q)=>{const{atlasFocusItemId:r,guidedGeneratorId:s,guidedRecipeId:a,...o}=t;e.setItem(X,JSON.stringify({...o,message:""}))},xt=(t=Q)=>{t.removeItem(X),t.removeItem(ke)},Mt=(t="small")=>`art-icon art-${t}`,p=(t,e,r,s="")=>`
  <svg class="${e}" viewBox="0 0 64 64" role="img" aria-label="${r}" ${s}>
    ${t}
  </svg>
`,A=(t="#fff7dc")=>`<ellipse cx="32" cy="48" rx="23" ry="8" fill="#000" opacity=".08"/><ellipse cx="32" cy="45" rx="24" ry="10" fill="${t}" stroke="#8f6b45" stroke-width="2"/>`,It=`
  <path d="M13 45c10-22 25-31 41-31-3 17-13 31-36 35 10-6 18-14 26-26-12 9-21 17-31 22z" fill="#6fbd68" stroke="#376f43" stroke-width="2"/>
  <path d="M20 43c9-5 17-12 25-21" fill="none" stroke="#eff8d7" stroke-width="2" stroke-linecap="round"/>
`,g=(t,e={})=>{const r=Mt(e.size),s=e.label??t,a=e.color??"#80b96c";switch(t){case"board_nav":return p(`
        <rect x="13" y="13" width="38" height="38" rx="7" fill="#f8f0df" stroke="#6f806f" stroke-width="3"/>
        <path d="M32 13v38M13 32h38" stroke="#9db18f" stroke-width="2"/>
        <rect x="17" y="17" width="11" height="11" rx="3" fill="#8fd26b" stroke="#3f7e45" stroke-width="1.5"/>
        <rect x="36" y="17" width="11" height="11" rx="3" fill="#f4cf71" stroke="#a87939" stroke-width="1.5"/>
        <rect x="17" y="36" width="11" height="11" rx="3" fill="#9bdaf0" stroke="#237b9b" stroke-width="1.5"/>
        <rect x="36" y="36" width="11" height="11" rx="3" fill="#ef8d84" stroke="#9a3438" stroke-width="1.5"/>
        `,r,s);case"order_nav":return p(`
        <path d="M18 10h28l4 7v37H14V17l4-7z" fill="#fff8e8" stroke="#8f6b45" stroke-width="3"/>
        <path d="M18 18h28M22 29h20M22 38h16M22 47h12" stroke="#bd8c52" stroke-width="3" stroke-linecap="round"/>
        <circle cx="44" cy="45" r="7" fill="#f0bf3e" stroke="#a17c22" stroke-width="2"/>
        `,r,s);case"atlas_nav":return p(`
        <path d="M13 18l13-5 13 5 12-5v38l-12 5-13-5-13 5V18z" fill="#eff7eb" stroke="#5f7a65" stroke-width="3" stroke-linejoin="round"/>
        <path d="M26 13v38M39 18v38" stroke="#a8bea2" stroke-width="2"/>
        <path d="M20 39c7-13 16-16 25-9" fill="none" stroke="#3e7c68" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="39" r="4" fill="#df6f63"/>
        <circle cx="45" cy="30" r="4" fill="#df6f63"/>
        `,r,s);case"leaf":case"sprout":case"greens":case"bok":case"jade":return p(`
        <ellipse cx="32" cy="50" rx="19" ry="6" fill="#000" opacity=".08"/>
        <path d="M20 47c-6-15-2-28 10-35 9 9 9 24-1 37" fill="#8fd26b" stroke="#3f7e45" stroke-width="2"/>
        <path d="M34 49c-2-16 4-29 17-35 6 12 2 26-12 36" fill="#5fb95f" stroke="#2f7542" stroke-width="2"/>
        <path d="M29 45c2-9 3-19 1-29M38 45c4-9 7-18 12-27" stroke="#eef8d9" stroke-width="2" stroke-linecap="round"/>
        `,r,s);case"dot":case"tomato":case"sweet":case"tomato_basket":case"tomato_crate":return p(`
        <ellipse cx="32" cy="50" rx="19" ry="6" fill="#000" opacity=".08"/>
        <circle cx="31" cy="34" r="18" fill="#ef5f55" stroke="#9a3438" stroke-width="2"/>
        <circle cx="25" cy="28" r="5" fill="#ff998d" opacity=".7"/>
        <path d="M28 18c2-5 7-8 13-7-2 5-6 8-12 9" fill="#5aa65a" stroke="#356f3e" stroke-width="2"/>
        <path d="M33 18c-6-2-10-5-11-10 6 0 10 3 13 9" fill="#6ebd62" stroke="#356f3e" stroke-width="2"/>
        `,r,s);case"egg":case"double":case"goldbox":return p(`
        ${A("#fff6d7")}
        <ellipse cx="25" cy="35" rx="11" ry="15" fill="#fff7de" stroke="#c9a15d" stroke-width="2"/>
        <ellipse cx="39" cy="35" rx="11" ry="15" fill="#fff0bd" stroke="#c9a15d" stroke-width="2"/>
        <circle cx="39" cy="37" r="5" fill="#f4b647"/>
        `,r,s);case"wheat":return p(`
        <ellipse cx="32" cy="51" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M32 53V12" stroke="#9d7131" stroke-width="3" stroke-linecap="round"/>
        <path d="M31 17c-8-3-10-8-8-13 7 2 10 6 8 13zM33 17c8-3 10-8 8-13-7 2-10 6-8 13zM31 29c-8-3-11-8-9-14 8 2 11 7 9 14zM33 29c8-3 11-8 9-14-8 2-11 7-9 14zM31 41c-8-3-10-8-8-13 7 2 10 6 8 13zM33 41c8-3 10-8 8-13-7 2-10 6-8 13z" fill="#e5b85d" stroke="#9d7131" stroke-width="1.5"/>
        `,r,s);case"flour":return p(`
        <ellipse cx="32" cy="50" rx="19" ry="6" fill="#000" opacity=".08"/>
        <path d="M18 22h28l4 28H14l4-28z" fill="#f4dfaa" stroke="#a87939" stroke-width="2"/>
        <path d="M21 22c1-7 21-7 22 0" fill="#fff1cc" stroke="#a87939" stroke-width="2"/>
        <circle cx="32" cy="36" r="8" fill="#fff8e2"/>
        `,r,s);case"dough":case"rise":case"soft":return p(`
        ${A("#fff1c9")}
        <path d="M17 38c4-12 14-17 28-14 8 7 7 18-3 22-12 5-27 1-25-8z" fill="#dcae62" stroke="#8c6335" stroke-width="2"/>
        <path d="M26 31c4-2 9-2 14 1" stroke="#f9db9f" stroke-width="3" stroke-linecap="round"/>
        `,r,s);case"bud":case"daisy":case"bunch":case"florist":case"goldflower":return p(`
        <ellipse cx="32" cy="51" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M32 50V31" stroke="#4f8b4d" stroke-width="3" stroke-linecap="round"/>
        <path d="M29 43c-8-3-12-8-13-15 9 1 14 6 16 15" fill="#70bc68" stroke="#397b43" stroke-width="2"/>
        <path d="M35 43c8-3 12-8 13-15-9 1-14 6-16 15" fill="#83cc70" stroke="#397b43" stroke-width="2"/>
        <g transform="translate(32 24)">
          <ellipse cx="0" cy="-10" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5"/>
          <ellipse cx="9" cy="-4" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(55 9 -4)"/>
          <ellipse cx="6" cy="8" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(125 6 8)"/>
          <ellipse cx="-6" cy="8" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(55 -6 8)"/>
          <ellipse cx="-9" cy="-4" rx="6" ry="10" fill="#fff9c9" stroke="#c5a83e" stroke-width="1.5" transform="rotate(125 -9 -4)"/>
          <circle cx="0" cy="0" r="6" fill="#f0bf3e" stroke="#a17c22" stroke-width="1.5"/>
        </g>
        `,r,s);case"rosebud":case"rose":case"roses":case"rosebox":case"royal":return p(`
        <ellipse cx="32" cy="51" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M33 51V32" stroke="#447d46" stroke-width="3" stroke-linecap="round"/>
        <path d="M31 43c-7-2-11-6-13-12 8 0 13 4 15 12" fill="#65b760" stroke="#397b43" stroke-width="2"/>
        <path d="M33 32c-13-6-12-21 0-25 11 4 14 19 0 25z" fill="#ef86a5" stroke="#a93462" stroke-width="2"/>
        <path d="M24 23c5-6 12-8 19-5M27 15c5 2 9 5 12 11" fill="none" stroke="#ffd3df" stroke-width="2" stroke-linecap="round"/>
        `,r,s);case"paper":case"box":case"gift":case"ribbonbox":case"luxury":return p(`
        <ellipse cx="32" cy="51" rx="19" ry="6" fill="#000" opacity=".08"/>
        <path d="M15 26h34v25H15z" fill="#f2d39f" stroke="#8c6335" stroke-width="2"/>
        <path d="M12 20h40v10H12z" fill="#f9e0b4" stroke="#8c6335" stroke-width="2"/>
        <path d="M30 20h6v31h-6z" fill="#df6f63"/>
        <path d="M22 18c-4-8 6-10 10 2M42 18c4-8-6-10-10 2" fill="none" stroke="#df6f63" stroke-width="4" stroke-linecap="round"/>
        `,r,s);case"line":case"ribbon":case"bow":case"flowerbow":case"silk":return p(`
        <ellipse cx="32" cy="50" rx="18" ry="5" fill="#000" opacity=".08"/>
        <path d="M31 32C16 18 8 28 14 39c7 6 15 2 17-7z" fill="#75c4e4" stroke="#237b9b" stroke-width="2"/>
        <path d="M33 32c15-14 23-4 17 7-7 6-15 2-17-7z" fill="#9bdaf0" stroke="#237b9b" stroke-width="2"/>
        <circle cx="32" cy="33" r="7" fill="#3da7cc" stroke="#237b9b" stroke-width="2"/>
        <path d="M27 39l-7 13M38 39l8 13" stroke="#237b9b" stroke-width="4" stroke-linecap="round"/>
        `,r,s);case"bao":return p(`
        ${A("#f1dfbd")}
        <path d="M16 38c0-13 9-22 17-22 9 0 16 9 16 22 0 10-33 10-33 0z" fill="#fff2d5" stroke="#a77b4c" stroke-width="2"/>
        <path d="M25 27c2 5 0 9-5 12M32 24c0 6 0 11 0 17M39 27c-2 5 0 9 5 12" fill="none" stroke="#d3aa72" stroke-width="2" stroke-linecap="round"/>
        `,r,s);case"panegg":return p(`
        <path d="M14 42h28c8 0 8 10 0 10H14c-8 0-8-10 0-10z" fill="#5c5c5c" stroke="#333" stroke-width="2"/>
        <path d="M43 46h15" stroke="#333" stroke-width="5" stroke-linecap="round"/>
        <path d="M18 28c10-9 28-5 28 8 0 8-8 11-18 10-12-1-18-10-10-18z" fill="#ffeec1" stroke="#c98d45" stroke-width="2"/>
        <circle cx="32" cy="36" r="8" fill="#f2b642" stroke="#b8782e" stroke-width="2"/>
        <circle cx="23" cy="31" r="5" fill="#ef5f55"/>
        `,r,s);case"pancake":return p(`
        ${A("#ffe3a3")}
        <circle cx="32" cy="34" r="18" fill="#d7b95e" stroke="#8c6335" stroke-width="2"/>
        <path d="M21 32c8-7 17-7 26 0M22 40c7 4 15 4 24 0" fill="none" stroke="#f4d887" stroke-width="3" stroke-linecap="round"/>
        <path d="M26 24l-6-9M38 23l7-9" stroke="#609b5c" stroke-width="3" stroke-linecap="round"/>
        `,r,s);case"morninggift":return p(`
        <ellipse cx="32" cy="51" rx="20" ry="6" fill="#000" opacity=".08"/>
        <path d="M16 28h32v23H16z" fill="#f0df8d" stroke="#8f6b45" stroke-width="2"/>
        <path d="M31 28h6v23h-6z" fill="#dc766a"/>
        <path d="M18 22h28v9H18z" fill="#fff1b4" stroke="#8f6b45" stroke-width="2"/>
        <path d="M17 21c6-13 13-10 17 3 4-13 12-16 17-3" fill="none" stroke="#dc766a" stroke-width="4" stroke-linecap="round"/>
        <circle cx="20" cy="18" r="5" fill="#fff6cd" stroke="#c5a83e" stroke-width="1.5"/>
        <circle cx="47" cy="18" r="5" fill="#ffd0df" stroke="#a93462" stroke-width="1.5"/>
        `,r,s);case"bento":return p(`
        <ellipse cx="32" cy="51" rx="21" ry="6" fill="#000" opacity=".08"/>
        <rect x="13" y="18" width="38" height="31" rx="7" fill="#f2b37c" stroke="#8f5e3d" stroke-width="2"/>
        <path d="M13 30h38M31 18v31" stroke="#8f5e3d" stroke-width="2"/>
        <circle cx="22" cy="39" r="6" fill="#fff2d5"/>
        <circle cx="41" cy="39" r="5" fill="#ef5f55"/>
        <path d="M36 26c5-5 10-5 13 0" stroke="#6ebd62" stroke-width="4" stroke-linecap="round"/>
        <path d="M20 25c3 1 6 1 9 0" stroke="#6ebd62" stroke-width="4" stroke-linecap="round"/>
        `,r,s);case"rosegift":return p(`
        <ellipse cx="32" cy="51" rx="21" ry="6" fill="#000" opacity=".08"/>
        <rect x="15" y="25" width="34" height="24" rx="5" fill="#ffe1ea" stroke="#9a4f68" stroke-width="2"/>
        <path d="M31 25h6v24h-6zM15 33h34" fill="#e7608e" stroke="#9a4f68" stroke-width="2"/>
        <path d="M25 23c-10-8-3-17 7-6 10-11 17-2 7 6" fill="#ef86a5" stroke="#9a4f68" stroke-width="2"/>
        <path d="M21 45c7-5 16-5 23 0" stroke="#fff8d7" stroke-width="3" stroke-linecap="round"/>
        `,r,s);case"veg":return p(`
        <ellipse cx="32" cy="51" rx="23" ry="7" fill="#000" opacity=".08"/>
        <path d="M14 28h36l-4 22H18z" fill="#c99558" stroke="#7b5a38" stroke-width="2"/>
        <path d="M19 30c3-16 24-16 27 0" fill="none" stroke="#7b5a38" stroke-width="4" stroke-linecap="round"/>
        <circle cx="25" cy="30" r="7" fill="#ef5f55"/>
        <path d="M31 31c4-10 11-15 19-13-2 9-8 14-18 15" fill="#74bd62" stroke="#397b43" stroke-width="2"/>
        <path d="M17 34c8-8 16-10 25-6" stroke="#f4d887" stroke-width="3" stroke-linecap="round"/>
        `,r,s);case"flower":return p(`
        <ellipse cx="32" cy="51" rx="22" ry="7" fill="#000" opacity=".08"/>
        <path d="M15 31h34l-5 20H20z" fill="#cf9f69" stroke="#7b5a38" stroke-width="2"/>
        <path d="M20 31c5-15 20-15 25 0" fill="none" stroke="#7b5a38" stroke-width="4" stroke-linecap="round"/>
        <path d="M26 47V25M38 47V22" stroke="#4f8b4d" stroke-width="3" stroke-linecap="round"/>
        <circle cx="25" cy="22" r="8" fill="#fff6c4" stroke="#c5a83e" stroke-width="2"/>
        <circle cx="39" cy="19" r="8" fill="#ef86a5" stroke="#a93462" stroke-width="2"/>
        `,r,s);case"crate":return p(`
        <ellipse cx="32" cy="51" rx="22" ry="7" fill="#000" opacity=".08"/>
        <rect x="13" y="22" width="38" height="28" rx="4" fill="#b78958" stroke="#6f4d31" stroke-width="2"/>
        <path d="M13 31h38M22 22v28M42 22v28M18 40h28" stroke="#6f4d31" stroke-width="2"/>
        <path d="M23 18h18v8H23z" fill="#e6d1a7" stroke="#6f4d31" stroke-width="2"/>
        `,r,s);case"steamer":return p(`
        <ellipse cx="32" cy="50" rx="22" ry="7" fill="#000" opacity=".08"/>
        <ellipse cx="32" cy="22" rx="21" ry="8" fill="#c9985f" stroke="#6f4d31" stroke-width="2"/>
        <path d="M12 22h40v23c0 6-40 6-40 0z" fill="#d9ad70" stroke="#6f4d31" stroke-width="2"/>
        <path d="M15 32h34M15 41h34" stroke="#8f633d" stroke-width="2"/>
        <path d="M25 13c-4-6 4-8 1-13M34 13c-4-6 4-8 1-13M43 13c-4-6 4-8 1-13" stroke="#fff4d6" stroke-width="3" stroke-linecap="round" opacity=".9"/>
        `,r,s);case"pan":return p(`
        <ellipse cx="27" cy="42" rx="20" ry="12" fill="#4f5656" stroke="#2d3333" stroke-width="2"/>
        <path d="M44 42h15" stroke="#2d3333" stroke-width="6" stroke-linecap="round"/>
        <circle cx="25" cy="38" r="8" fill="#fff2d5"/>
        <circle cx="25" cy="38" r="4" fill="#f2b642"/>
        <path d="M34 31c7 3 10 7 8 12" stroke="#c8d27a" stroke-width="4" stroke-linecap="round"/>
        `,r,s);case"gift_table":return p(`
        <ellipse cx="32" cy="52" rx="22" ry="6" fill="#000" opacity=".08"/>
        <path d="M14 28h36v18H14z" fill="#bf875b" stroke="#6f4d31" stroke-width="2"/>
        <path d="M19 46v10M45 46v10" stroke="#6f4d31" stroke-width="4" stroke-linecap="round"/>
        <rect x="23" y="14" width="18" height="17" rx="3" fill="#f0df8d" stroke="#8f6b45" stroke-width="2"/>
        <path d="M32 14v17M23 22h18" stroke="#dc766a" stroke-width="3"/>
        `,r,s);case"neighbor":case"student":case"coder":case"gardener":case"planner":case"courier":return p(`
        <circle cx="32" cy="32" r="28" fill="${a}" opacity=".18"/>
        <circle cx="32" cy="24" r="12" fill="#f4c6a1" stroke="#8f6b45" stroke-width="2"/>
        <path d="M17 55c2-14 9-22 15-22s13 8 15 22" fill="${a}" stroke="#6c5a48" stroke-width="2"/>
        <path d="M22 21c4-10 18-11 22 0-8 1-14-1-22 0z" fill="#5b4a39"/>
        <circle cx="28" cy="25" r="1.6" fill="#3d342c"/>
        <circle cx="36" cy="25" r="1.6" fill="#3d342c"/>
        <path d="M28 31c3 3 6 3 9 0" fill="none" stroke="#8f6b45" stroke-width="2" stroke-linecap="round"/>
        `,r,s);default:return p(It,r,s)}},Ct=new URL("/assets/style-reference-shop-runtime-CIti6Xg-.jpg",import.meta.url).href,I=[{title:"第一步：点两个相同材料",body:"先点第一片菜叶，再点第二片菜叶。两个相同材料会合成更高一级。",tip:"完成操作后才能进入下一步。",board:["greens_1","greens_1",null,null,"tomato_1",null,"egg_1",null,null,"wheat_1",null,null,null,null,null,null],focus:[0,1]},{title:"第二步：取材进棋盘",body:"点一次菜篮，材料会自动落到空格里。正式游戏里每次取材会消耗体力。",tip:"取到材料后继续下一步。",board:[null,null,"greens_2",null,"tomato_1","tomato_1",null,null,null,"wheat_1",null,null,null,null,null,null],focus:[6]},{title:"第三步：确认订单目标",body:"棋盘上发光的是订单需要的材料。点下方这张「街坊早餐」订单卡，确认要追踪这单。",tip:"确认后，正式游戏里可以从底部「订单」入口继续提交订单。",board:["greens_2","egg_2",null,null,"tomato_1","wheat_1","wheat_1",null,null,null,"daisy_1",null,null,null,null,null],focus:[0,1]},{title:"第四步：开始经营",body:"主屏只放正在操作的内容。订单、任务、图谱和店铺都在底部入口里。",tip:"完成教学后进入正式棋盘，从第一单街坊早餐开始。",board:["greens_2","egg_2","wheat_2","daisy_1","box_1","ribbon_1",null,null,null,null,null,null,null,null,null,null],focus:[0,1]}],c=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),ee=t=>{if(t<=0)return"可收取";const e=Math.ceil(t/1e3),r=Math.floor(e/60),s=e%60;return r>0?`${r}:${s.toString().padStart(2,"0")}`:`${s}s`},m=(t,e=!1)=>{const r=d[t];return`
    <span class="item-chip ${e?"compact":""}" style="--chip:${r.color}">
      <span class="item-mark">${g(r.icon,{size:"tiny",label:r.name,color:r.color})}</span>
      <span class="item-name">${c(r.name)}</span>
    </span>
  `},te=t=>{const e=new Map;return t.forEach(r=>e.set(r,(e.get(r)??0)+1)),[...e.entries()]},ve=(t,e)=>te(e).map(([r,s])=>{const a=j(t,r);return`
        <div class="need ${a>=s?"ok":""}">
          ${m(r,!0)}
          <span>${a}/${s}</span>
        </div>
      `}).join(""),St=t=>C.filter(e=>e.drops.includes(t)).map(e=>e.name),$e=t=>K.find(e=>e.next===t),E=t=>S.find(e=>e.output===t),Tt=t=>Me(t)[0],_e=t=>{const e=Tt(t);return e?C.map(s=>{const a=s.drops.filter(o=>o===e).length;return a>0?{generator:s,probability:a/s.drops.length}:void 0}).filter(Boolean).sort((s,a)=>a.probability-s.probability)[0]:void 0},we=t=>{const e=_e(t);return e?{name:e.generator.name,probability:e.probability}:void 0},xe=t=>t===void 0?"":t<=0?"现有材料可合成":`预计还需约 ${Math.max(1,Math.ceil(t))} 次取材`,ne=t=>{const e=d[t];return e?2**(e.level-1):0},P=(t,e,r=1)=>{const s=E(e);if(s){const u=s.inputs.map(b=>P(t,b,r));return u.some(b=>b===void 0)?void 0:u.reduce((b,_)=>b+_,0)}const a=d[e],o=we(e);if(!a||!o)return;const n=r*ne(e),l=t.board.reduce((u,b)=>{if(!b)return u;const _=d[b.itemId];return!_||_.chain!==a.chain||_.level>a.level?u:u+ne(b.itemId)},0);return Math.max(0,n-l)/o.probability},Et=t=>{const e=E(t);if(e)return`${w[e.cooker]}制作，先备齐 ${e.inputs.map(s=>d[s].name).join(" + ")}`;const r=we(t);return r?`主要来源：${r.name}`:"暂无来源配置"},N=t=>{const e=d[t],r=E(t);if(r)return`在${w[r.cooker]}制作：${r.inputs.map(o=>d[o].name).join(" + ")}`;const s=$e(t);if(s)return`由 2 个「${s.name}」合成`;const a=St(t);return a.length?`从${a.join(" / ")}取材`:`${e.name} 暂无来源配置`},Me=t=>{const e=[];let r=t;for(;r;)e.unshift(r),r=$e(r)?.id;return e},Ie=(t,e,r)=>r?E(e)?P(t,e,r.missing):P(t,e,r.required):P(t,e,1),ie=(t,e,r)=>{const s=xe(Ie(t,e,r)),a=r?`已有 ${r.owned}/${r.required}，还差 ${r.missing}`:void 0;return`
    <div class="path-meta">
      ${a?`<span>${c(a)}</span>`:""}
      <span>${c(Et(e))}</span>
      ${s?`<span>${c(s)}</span>`:""}
    </div>
  `},B=(t,e,r)=>{const s=E(e),a=_e(e),o=s?`去${w[s.cooker]}制作`:a?`去${a.generator.name}取材`:"";if(s)return`
      <div class="atlas-path recipe-path">
        <div class="path-title">${m(e,!0)}<span>${c(N(e))}</span></div>
        ${ie(t,e,r)}
        <button class="mini-button atlas-source-btn" data-guide-source="${e}">${o}</button>
        <div class="path-chain">
          ${s.inputs.map(l=>m(l,!0)).join('<span class="path-arrow">+</span>')}
          <span class="path-arrow">=</span>
          ${m(s.output,!0)}
        </div>
      </div>
    `;const n=Me(e);return`
    <div class="atlas-path">
      <div class="path-title">${m(e,!0)}<span>${c(N(e))}</span></div>
      ${ie(t,e,r)}
      ${o?`<button class="mini-button atlas-source-btn" data-guide-source="${e}">${o}</button>`:""}
      <div class="path-chain">
        ${n.map(l=>m(l,!0)).join('<span class="path-arrow">→</span>')}
      </div>
    </div>
  `},Ce=(t,e)=>{const r=te(e).map(([s,a])=>{const o=j(t,s);return o>=a?"":`${d[s].name} ${o}/${a}`}).filter(Boolean);return r.length?`还差 ${r.join("、")}`:"材料齐了"},Se=(t,e)=>te(e).map(([r,s])=>{const a=j(t,r);return{itemId:r,required:s,owned:a,missing:Math.max(0,s-a)}}).filter(r=>r.missing>0),Te=(t,e)=>{const r=Se(t,e).slice(0,2);return r.length?`
    <div class="quick-guide">
      <b>怎么做</b>
      ${r.map(s=>{const a=xe(Ie(t,s.itemId,s)),o=a?` · ${a}`:"";return`<button class="quick-guide-item" data-atlas-item="${s.itemId}">${c(d[s.itemId].name)}：缺 ${s.missing} 个 · ${c(N(s.itemId))}${c(o)} · 查看图谱</button>`}).join("")}
    </div>
  `:""},Ee=t=>v.every(e=>$(t,e.id,"onboarding"))?"daily":"onboarding",Ae=t=>t==="onboarding"?v:L,Oe=(t,e)=>e==="onboarding"?Ve(t):Ke(t),At=(t,e)=>e==="onboarding"?He(t):Ye(t),Ot=t=>{const e=Ee(t),r=Oe(t,e),s=t.trackedTaskScope===e?r.find(a=>a.id===t.trackedTaskId):void 0;return{scope:e,task:s??r[0]}},Pt=t=>{const{scope:e,task:r}=Ot(t),s=Ae(e),a=s.filter(l=>G(t,l)).length,o=At(t,e).length;if(!r)return`
      <section class="tracked-task done">
        <div>
          <span>${e==="onboarding"?"开张任务":"今日委托"}</span>
          <b>${o?`有 ${o} 个奖励待领取`:e==="onboarding"?"开张任务已完成":"今日委托已完成"}</b>
        </div>
        <button class="mini-button" data-sheet="tasks">任务</button>
      </section>
    `;const n=he(t,r);return`
    <section class="tracked-task">
      <div>
        <span>${e==="onboarding"?"开张":"今日"} ${a}/${s.length}</span>
        <b>${c(r.title)}</b>
        <p>${c(r.desc)}${n.target>1?` · ${n.current}/${n.target}`:""}</p>
      </div>
      <button class="mini-button" data-sheet="tasks">任务</button>
    </section>
  `},ce=(t,e)=>{const r=Ae(e),s=Oe(t,e),a=r.filter(n=>G(t,n)).length,o=e==="onboarding"?"开张任务":"今日委托";return s.length?`
    <section class="task-group">
      <div class="panel-title"><h3>${o}</h3><span class="task-count">${a}/${r.length}</span></div>
      <div class="task-list">
        ${s.map(n=>{const l=G(t,n),i=he(t,n),u=t.trackedTaskScope===e&&t.trackedTaskId===n.id;return`
              <div class="task-row ${l?"done":""}">
                <span class="task-check">${l?"✓":""}</span>
                <div><b>${c(n.title)}</b><p>${c(n.desc)}${i.target>1?` · ${i.current}/${i.target}`:""}</p></div>
                <small>${c(n.rewardLabel)}</small>
                ${l?`<button class="mini-button claim-task-btn" data-claim-task="${n.id}" data-task-scope="${e}">领取</button>`:`<button class="mini-button track-task-btn" data-track-task="${n.id}" data-task-scope="${e}" ${u?"disabled":""}>${u?"追踪中":"追踪"}</button>`}
              </div>
            `}).join("")}
      </div>
    </section>
  `:`
      <section class="task-group complete">
        <div class="panel-title"><h3>${o}</h3><span class="task-count">完成</span></div>
        <div class="task-complete"><b>${e==="onboarding"?"开张任务已完成":"今日委托已完成"}</b><p>${e==="onboarding"?"现在可以开始完成今日委托。":"明天会刷新新的三项委托。"}</p></div>
      </section>
    `},Pe=(t,e=!1)=>`
  <div class="panel day-tasks ${e?"sheet-card":""}">
    <div class="panel-title"><h2>任务</h2><span>${t.dayKey}</span></div>
    ${ce(t,"onboarding")}
    ${Ee(t)==="daily"?ce(t,"daily"):""}
  </div>
`,Lt=t=>{const e=k.order_001,r=k.order_007,s=t.completedOrders.includes("order_001");return t.completedOrders.includes("order_007")?k.order_008:s?r:e},zt=(t,e)=>{const r=I[e],s=t.tutorial?.board??r.board.map(o=>o?{uid:o,itemId:o}:null),a=t.tutorial?.selectedCell;return`
    <div class="training-board" role="grid" aria-label="新手教学棋盘">
      ${s.map((o,n)=>{const l=r.focus.includes(n);if(!o)return`<button class="training-cell empty ${l?"focus":""} ${a===n?"selected":""}" data-tutorial-cell="${n}" role="gridcell" aria-label="空格"></button>`;const i=d[o.itemId];return`
            <button class="training-cell filled ${l?"focus":""} ${a===n?"selected":""}" data-tutorial-cell="${n}" role="gridcell" aria-label="${c(i.name)}">
              <span class="asset-gem" style="--gem:${i.color}" aria-hidden="true">
                ${g(i.icon,{size:"large",label:i.name,color:i.color})}
              </span>
              <span class="cell-level">Lv.${i.level}</span>
            </button>
          `}).join("")}
    </div>
  `},Dt=(t,e)=>{const r=!!t.tutorial?.actionDone;return e===1?`
      <div class="tutorial-action-card">
        <button class="generator-card tutorial-generator" data-tutorial-generator style="--accent:#6ebd62">
          <span class="generator-icon">${g("veg",{size:"small",label:"菜篮"})}</span>
          <span class="generator-name">点菜篮取材</span>
          <span class="generator-meta">${r?"已放入棋盘":"试一次"}</span>
        </button>
      </div>
    `:e===2?`
      <button class="tutorial-order-card tutorial-order-button interactive ${r?"done":""}" data-tutorial-order type="button">
        <span class="tutorial-tap-cue">${r?"已确认":"点这里确认目标"}</span>
        <span class="tutorial-order-main">
          <b>街坊早餐</b>
          <span class="tutorial-order-copy">需要棋盘上发光的 2 个材料</span>
          <span class="tutorial-order-needs">需要：${m("greens_2",!0)} ${m("egg_2",!0)}</span>
        </span>
        <span class="tutorial-order-cta">${r?"已确认":"确认"}</span>
      </button>
    `:`
    <div class="tutorial-order-card ${r?"done":""}">
      <b>${r?"操作完成":"操作目标"}</b>
      <span>${e===0?r?"菜叶已经合成小青菜。":"点两片菜叶完成一次合成。":"进入正式游戏，完成街坊早餐。"}</span>
    </div>
  `},jt=t=>{const e=Math.max(0,Math.min(I.length-1,t.tutorial?.step??0)),r=I[e],s=e===I.length-1,a=s||!!t.tutorial?.actionDone;return`
    <main class="tutorial-shell">
      <section class="tutorial-page" aria-label="新手教学">
        <header class="tutorial-hero">
          <p class="eyebrow">新手教学</p>
          <h1>巷口花食铺</h1>
          <div class="tutorial-progress-track" aria-label="教学进度">
            ${I.map((o,n)=>`<span class="${n<=e?"active":""}"></span>`).join("")}
          </div>
        </header>

        <section class="tutorial-lesson">
          <div class="tutorial-copy">
            <span class="tutorial-progress">${e+1}/${I.length}</span>
            <h2>${c(r.title)}</h2>
            <p>${c(r.body)}</p>
            <small>${c(r.tip)}</small>
          </div>
          ${zt(t,e)}
          ${Dt(t,e)}
        </section>

        <div class="tutorial-page-actions">
          <button class="secondary-button" ${t.tutorial?.resumeAvailable?"data-tutorial-return":"data-tutorial-prev"} ${!t.tutorial?.resumeAvailable&&e===0?"disabled":""}>${t.tutorial?.resumeAvailable?"返回小店":"上一步"}</button>
          <button class="primary-button" ${s?"data-tutorial-complete":"data-tutorial-next"} ${a?"":"disabled"}>
            ${s?"完成教学，开始游戏":a?"下一步":"先完成操作"}
          </button>
        </div>
      </section>
    </main>
  `},qt=t=>{const e=t.pendingStory;if(!e)return"";const r=Y[e.customerId],s=k[e.orderId];return`
    <div class="story-backdrop" role="dialog" aria-modal="true" aria-label="顾客故事">
      <article class="story-dialog">
        <div class="story-portrait" style="--avatar:${r.color}">
          ${g(r.avatar,{size:"large",label:r.name,color:r.color})}
        </div>
        <div class="story-content">
          <span class="story-kicker">${c(r.name)} · 第 ${e.chapter} 段</span>
          <h2>${c(s.title)}</h2>
          <p>${c(e.line)}</p>
          <div class="story-reward">已获得：${s.coin} 金币 · ${s.xp} 经验${s.storyPoints?` · ${s.storyPoints} 故事点`:""}</div>
          <button class="primary-button story-close-btn">继续经营</button>
        </div>
      </article>
    </div>
  `},Le=(t,e="atlas-panel")=>{const r=Lt(t),s=Se(t,r.needs),a=t.atlasFocusItemId,o=a?s.find(l=>l.itemId===a):void 0,n=["greens","tomato","egg","wheat","daisy","rose","box","ribbon"].map(l=>K.filter(i=>i.chain===l)).filter(l=>l.length>0);return`
    <details class="panel atlas-panel" id="${e}" open>
      <summary class="panel-title">
        <h2>合成图谱</h2>
        <span>缺材料怎么做</span>
      </summary>
      <div class="atlas-section">
        <h3>${a?`已定位：${c(d[a].name)}`:`当前目标：${c(r.title)}`}</h3>
        ${a?B(t,a,o):s.length?s.map(l=>B(t,l.itemId,l)).join(""):'<div class="atlas-empty">当前订单材料已经齐了，直接去订单区提交。</div>'}
      </div>
      <details class="atlas-more">
        <summary>查看全部基础链</summary>
        <div class="chain-list">
          ${n.map(l=>`
                <div class="chain-row">
                  ${l.map(i=>m(i.id,!0)).join('<span class="path-arrow">→</span>')}
                </div>
              `).join("")}
        </div>
      </details>
      <details class="atlas-more">
        <summary>查看菜品与礼盒配方</summary>
        <div class="chain-list">
          ${S.map(l=>B(t,l.output)).join("")}
        </div>
      </details>
    </details>
  `},ze=(t,e="orders-panel")=>`
  <div class="panel orders" id="${e}">
    <div class="panel-title"><h2>订单</h2></div>
    <div class="order-list">
      ${t.activeOrders.map(r=>{const s=k[r],a=Y[s.customerId],o=q(t,s.needs),n=s.id==="order_001"||t.completedOrders.includes("order_001")&&s.id==="order_007";return`
            <article class="order-card ${s.story?"story":""} ${n?"recommended":""}">
              <div class="order-head">
                <span class="avatar" style="--avatar:${a.color}">${g(a.avatar,{size:"small",label:a.name,color:a.color})}</span>
                <div>
                  <h3>${c(s.title)}</h3>
                  <p>${c(a.name)} · ${n?"推荐先做":s.story?"故事订单":a.role}</p>
                </div>
              </div>
              <div class="need-list">${ve(t,s.needs)}</div>
              <div class="card-hint ${o?"ready":""}">${c(o?"材料齐了，可以提交":Ce(t,s.needs))}</div>
              ${Te(t,s.needs)}
              <div class="order-reward">+${s.coin} 金币 · +${s.xp} 经验${s.storyPoints?` · +${s.storyPoints} 故事点`:""}</div>
              <button class="primary-button" data-order="${s.id}" ${o?"":"disabled"}>提交订单</button>
            </article>
          `}).join("")}
    </div>
  </div>
`,De=t=>`
  <details class="panel recipes collapsible-panel" ${t.completedOrders.includes("order_001")?"open":""}>
    <summary class="panel-title"><h2>菜品与礼盒</h2><span>${t.completedOrders.includes("order_001")?"已展开":"早餐后展开"}</span></summary>
    <div class="recipe-list">
      ${S.map(e=>{const r=q(t,e.inputs)&&!t.cookers[e.cooker].recipeId,s=!!t.cookers[e.cooker].recipeId;return`
            <article class="recipe-card ${e.id===t.guidedRecipeId?"guided":""}">
              <div class="recipe-main">
                ${m(e.output,!0)}
                <div>
                  <h3>${e.name}</h3>
                  <p>${w[e.cooker]} · ${ee(e.durationMs)}</p>
                </div>
              </div>
              <div class="need-list">${ve(t,e.inputs)}</div>
              <div class="card-hint ${r?"ready":""}">${c(r?"材料齐了，可以开做":s?`${w[e.cooker]}正忙`:Ce(t,e.inputs))}</div>
              ${Te(t,e.inputs)}
              <button class="secondary-button" data-recipe="${e.id}" ${r?"":"disabled"}>开始制作</button>
            </article>
          `}).join("")}
    </div>
  </details>
`,je=t=>`
  <details class="panel shop-upgrades collapsible-panel" ${t.completedOrders.includes("order_007")?"open":""}>
    <summary class="panel-title"><h2>店铺升级</h2><span>${t.completedOrders.includes("order_007")?"已展开":"故事点后展开"}</span></summary>
    <div class="upgrade-list">
      ${pe.map(e=>{const r=t.shop[e.id],s=e.levels.find(n=>n.level===r),a=e.levels.find(n=>n.level===r+1),o=!!a&&t.coins>=a.coinCost&&t.storyPoints>=a.storyCost;return`
            <article class="upgrade-card">
              <h3>${e.name} Lv.${r}</h3>
              <p>${s.title} · ${s.effect}</p>
              <button class="secondary-button" data-upgrade="${e.id}" ${o?"":"disabled"}>
                ${a?`${a.coinCost} 金币 / ${a.storyCost} 故事点`:"已满级"}
              </button>
            </article>
          `}).join("")}
    </div>
  </details>
`,Bt=(t,e,r)=>{if(!t)return`<button class="board-cell empty ${r.selectedCell===e?"selected":""}" data-cell="${e}" aria-label="空格"></button>`;const s=d[t.itemId];return`
    <button class="board-cell filled ${r.selectedCell===e?"selected":""}" data-cell="${e}" draggable="true" aria-label="${c(s.name)}">
      <span class="asset-gem" style="--gem:${s.color}" aria-hidden="true">
        ${g(s.icon,{size:"large",label:s.name,color:s.color})}
      </span>
      <span class="cell-name">${c(s.name)}</span>
      <span class="cell-level">Lv.${s.level}</span>
    </button>
  `},qe=t=>{const e=t.shop.signboard,r=t.shop.tables,s=t.shop.flower_shelf,a=t.shop.kitchen,o=e+r+s+a;return`
    <section class="shop-stage" aria-label="小店外观">
      <img src="${Ct}" alt="巷口花食铺小店美术基准图" />
      <div class="shop-stage-overlay">
        <strong>小店修复度 ${Math.round(o/12*100)}%</strong>
        <span>门头 Lv.${e} · 餐桌 Lv.${r} · 花架 Lv.${s} · 后厨 Lv.${a}</span>
      </div>
    </section>
  `},Be=t=>C.map(e=>{const r=t.generators[e.id],s=r.charges<=0?ee(r.readyAt-Date.now()):"";return`
        <button class="generator-card ${t.guidedGeneratorId===e.id?"guided":""}" data-generator="${e.id}" style="--accent:${e.color}">
          <span class="generator-icon">${g(e.icon,{size:"small",label:e.name,color:e.color})}</span>
          <span class="generator-name">${c(e.name)}</span>
          <span class="generator-meta">${r.charges}/${e.maxCharges}${s?` · ${s}`:""}</span>
        </button>
      `}).join(""),Re=t=>["steamer","pan","gift_table"].map(e=>{const r=t.cookers[e],s=r.recipeId?S.find(o=>o.id===r.recipeId):void 0,a=r.readyAt?Date.now()>=r.readyAt:!1;return`
        <div class="cooker-card ${s?"busy":""} ${s?.id===t.guidedRecipeId?"guided":""}">
          <div class="cooker-head">
            <span class="cooker-title">${g(e,{size:"tiny",label:w[e]})}<b>${w[e]}</b></span>
            <button class="mini-button" data-collect="${e}" ${s?"":"disabled"}>${a?"收取":"查看"}</button>
          </div>
          <p>${s?`${s.name} · ${ee((r.readyAt??0)-Date.now())}`:"空闲中"}</p>
        </div>
      `}).join(""),Rt=t=>`
  <div class="mobile-tools" id="material-tools">
    <div class="mobile-tool-head">
      <h2>取材</h2>
      <button class="text-button energy-btn">模拟广告 +30 体力</button>
    </div>
    <div class="generator-grid">${Be(t)}</div>
  </div>
`,Gt=()=>`
  <nav class="mobile-tabbar" aria-label="快速导航">
    <button class="mobile-tab active" data-close-sheet aria-current="page">
      <span class="tab-art">${g("board_nav",{size:"tiny",label:"棋盘"})}</span>
      <span>棋盘</span>
    </button>
    <button class="mobile-tab" data-sheet="tasks">
      <span class="tab-art">${g("order_nav",{size:"tiny",label:"任务"})}</span>
      <span>任务</span>
    </button>
    <button class="mobile-tab" data-sheet="orders">
      <span class="tab-art">${g("order_nav",{size:"tiny",label:"订单"})}</span>
      <span>订单</span>
    </button>
    <button class="mobile-tab" data-sheet="atlas">
      <span class="tab-art">${g("atlas_nav",{size:"tiny",label:"图谱"})}</span>
      <span>图谱</span>
    </button>
    <button class="mobile-tab" data-sheet="shop">
      <span class="tab-art">${g("florist",{size:"tiny",label:"店铺"})}</span>
      <span>店铺</span>
    </button>
  </nav>
`,O=(t,e,r)=>`
  <section class="mobile-sheet" data-sheet-panel="${t}" hidden>
    <div class="mobile-sheet-head">
      <h2>${c(e)}</h2>
      <button class="icon-button mobile-sheet-close" data-close-sheet aria-label="关闭">×</button>
    </div>
    <div class="mobile-sheet-body">${r}</div>
  </section>
`,Nt=t=>`
  <div class="mobile-sheet-backdrop" data-close-sheet hidden></div>
  ${O("tasks","任务",Pe(t,!0))}
  ${O("orders","订单",ze(t,"mobile-orders-panel"))}
  ${O("atlas","合成图谱",Le(t,"mobile-atlas-panel"))}
  ${O("shop","店铺与制作",`
      ${qe(t)}
      <div class="cooker-grid">${Re(t)}</div>
      ${De(t)}
      ${je(t)}
    `)}
`,h=(t,e,r,s)=>{t.querySelectorAll(e).forEach(a=>{a.addEventListener(r,o=>s(a,o))})},Ut=(t,e,r,s)=>{if(!(e.tutorial??{completed:!1}).completed){t.innerHTML=jt(e),h(t,"[data-tutorial-cell]","click",l=>r(dt(e,Number(l.dataset.tutorialCell)))),t.querySelector("[data-tutorial-generator]")?.addEventListener("click",()=>r(ut(e))),t.querySelector("[data-tutorial-order]")?.addEventListener("click",()=>r(pt(e))),t.querySelector("[data-tutorial-prev]")?.addEventListener("click",()=>r(le(e,(e.tutorial?.step??0)-1))),t.querySelector("[data-tutorial-return]")?.addEventListener("click",()=>r(ht(e))),t.querySelector("[data-tutorial-next]")?.addEventListener("click",()=>r(le(e,(e.tutorial?.step??0)+1))),t.querySelector("[data-tutorial-complete]")?.addEventListener("click",()=>r(ft(e)));return}t.innerHTML=`
    <main class="game-shell ${s.pulse?`reward-${s.pulse}`:""}">
      <header class="topbar">
        <div>
          <p class="eyebrow">Web MVP 原型</p>
          <h1>巷口花食铺</h1>
        </div>
        <div class="wallet">
          <span><span class="wallet-label-full">金币</span><span class="wallet-label-short">金</span> <b>${e.coins}</b></span>
          <span><span class="wallet-label-full">体力</span><span class="wallet-label-short">体</span> <b>${e.energy}/${e.maxEnergy}</b></span>
          <span><span class="wallet-label-full">经验</span><span class="wallet-label-short">验</span> <b>${e.xp}</b></span>
          <span><span class="wallet-label-full">故事点</span><span class="wallet-label-short">故</span> <b>${e.storyPoints}</b></span>
          <span><span class="wallet-label-full">Lv.</span><span class="wallet-label-short">Lv</span><b>${e.level}</b></span>
        </div>
        <button class="icon-button tutorial-open-btn" title="重新进入新手教学" aria-label="重新进入新手教学">?</button>
        <button class="icon-button reset-btn" title="重置存档" aria-label="重置存档">R</button>
      </header>

      <section class="message-toast ${s.toast?"visible":""}" role="status" aria-live="polite">${c(s.toast)}</section>
      ${qt(e)}

      <div class="layout">
        <section class="left-rail">
          ${qe(e)}
          ${Pe(e)}

          <div class="panel generators">
            <div class="panel-title">
              <h2>取材</h2>
              <button class="text-button energy-btn">模拟广告 +30 体力</button>
            </div>
            <div class="generator-grid">${Be(e)}</div>
          </div>

          <div class="panel cookers">
            <div class="panel-title"><h2>制作台</h2></div>
            <div class="cooker-grid">${Re(e)}</div>
          </div>
        </section>

        <section class="board-panel" id="play-area">
          ${Pt(e)}
          <div class="panel-title board-title">
            <h2>合成棋盘</h2>
            <button class="text-button sell-btn" ${e.selectedCell===void 0?"disabled":""}>出售选中</button>
          </div>
          <div class="board">
            ${e.board.map((l,i)=>Bt(l,i,e)).join("")}
          </div>
          ${Rt(e)}
        </section>

        <aside class="right-rail">
          ${ze(e)}
          ${Le(e)}
          ${De(e)}
          ${je(e)}
        </aside>
      </div>
      ${Nt(e)}
      ${Gt()}
    </main>
  `,h(t,"[data-generator]","click",l=>r(Qe(e,l.dataset.generator,s.runtime))),h(t,"[data-cell]","click",l=>r(oe(e,Number(l.dataset.cell)))),h(t,"[data-order]","click",l=>r(ot(e,l.dataset.order))),h(t,"[data-recipe]","click",l=>r(rt(e,l.dataset.recipe,s.runtime.nowMs))),h(t,"[data-collect]","click",l=>r(st(e,l.dataset.collect,s.runtime.nowMs))),h(t,"[data-upgrade]","click",l=>r(lt(e,l.dataset.upgrade))),h(t,"[data-track-task]","click",l=>r(it(e,l.dataset.trackTask,l.dataset.taskScope))),h(t,"[data-claim-task]","click",l=>r(ct(e,l.dataset.claimTask,l.dataset.taskScope)));const o=()=>{t.querySelector(".game-shell")?.removeAttribute("data-open-sheet"),t.querySelector(".mobile-sheet-backdrop")?.setAttribute("hidden",""),t.querySelectorAll("[data-sheet-panel]").forEach(l=>l.setAttribute("hidden","")),t.querySelectorAll("[data-sheet], [data-close-sheet]").forEach(l=>{l.classList.toggle("active",l.hasAttribute("data-close-sheet")&&l.classList.contains("mobile-tab")),l.hasAttribute("data-close-sheet")&&l.classList.contains("mobile-tab")?l.setAttribute("aria-current","page"):l.removeAttribute("aria-current")})},n=l=>{const i=t.querySelector(`.mobile-tab[data-sheet="${l}"]`);t.querySelector(".game-shell")?.setAttribute("data-open-sheet",l),t.querySelector(".mobile-sheet-backdrop")?.removeAttribute("hidden"),t.querySelectorAll("[data-sheet-panel]").forEach(u=>{u.toggleAttribute("hidden",u.dataset.sheetPanel!==l)}),t.querySelectorAll("[data-sheet], [data-close-sheet]").forEach(u=>{const b=u===i;u.classList.toggle("active",b),b?u.setAttribute("aria-current","page"):u.removeAttribute("aria-current")})};h(t,"[data-sheet]","click",l=>{const i=l.dataset.sheet;i&&n(i)}),h(t,"[data-close-sheet]","click",()=>o()),h(t,"[data-atlas-item]","click",l=>{r(mt(e,l.dataset.atlasItem)),n("atlas")}),h(t,"[data-guide-source]","click",l=>{const i=l.dataset.guideSource,u=yt(e,i);r(u),n(u.guidedRecipeId?"shop":"board"),u.guidedRecipeId||o()}),t.querySelectorAll(".energy-btn").forEach(l=>l.addEventListener("click",()=>r(nt(e)))),t.querySelector(".story-close-btn")?.addEventListener("click",()=>r(gt(e))),t.querySelector(".tutorial-open-btn")?.addEventListener("click",()=>r(bt(e))),t.querySelector(".sell-btn")?.addEventListener("click",()=>{e.selectedCell!==void 0&&r(tt(e,e.selectedCell))}),t.querySelector(".reset-btn")?.addEventListener("click",()=>{xt(),window.location.reload()}),t.querySelectorAll("[data-cell][draggable=true]").forEach(l=>{l.addEventListener("dragstart",i=>{i.dataTransfer?.setData("text/plain",l.dataset.cell??"")})}),t.querySelectorAll("[data-cell]").forEach(l=>{l.addEventListener("dragover",i=>i.preventDefault()),l.addEventListener("drop",i=>{i.preventDefault();const u=Number(i.dataTransfer?.getData("text/plain")),b=Number(l.dataset.cell);if(Number.isFinite(u)&&Number.isFinite(b)){const _=oe({...e,selectedCell:u},b);r(_)}})})},Ge=document.querySelector("#app");if(!Ge)throw new Error("Missing #app");const U=Date.now();let M=_t(U)??Ze(U);M=ye(M,U);let F="",V,R;const Ft=()=>({nowMs:Date.now(),random:Math.random}),Ne=t=>{const e=t.message;M={...t,message:""},wt(M),e&&(F=e,V=e.includes("合成")?"merge":e.includes("完成「")?"order":e.includes("领取")?"task":void 0,R!==void 0&&window.clearTimeout(R),R=window.setTimeout(()=>{F="",V=void 0,H()},2800)),H()},H=()=>{Ut(Ge,M,Ne,{toast:F,pulse:V,runtime:Ft()})};H();window.setInterval(()=>{const t=ye(M,Date.now());t!==M&&Ne(t)},1e3);
