	var WIDTH = 500;
	var HEIGHT = 500;
	var socket = io();
	
	//Registro
	var signDiv = document.getElementById('signDiv');
	var signDivUsername = document.getElementById('signDiv-username');
	var signDivSignIn = document.getElementById('signDiv-signIn');
	var signDivSignUp = document.getElementById('signDiv-signUp');
	var signDivPassword = document.getElementById('signDiv-password');
	
	signDivSignIn.onclick = function(){
		socket.emit('signIn',{username:signDivUsername.value,password:signDivPassword.value});
	}
	signDivSignUp.onclick = function(){
		socket.emit('signUp',{username:signDivUsername.value,password:signDivPassword.value});
	}
	socket.on('signInResponse',function(data){
		if(data.success){
			signDiv.style.display = 'none';
			gameDiv.style.display = 'inline-block';
		} else
			alert("Sign in unsuccessul.");
	});
	socket.on('signUpResponse',function(data){
		if(data.success){
			alert("Sign up successul.");
		} else
			alert("Sign up unsuccessul.");
	});

	//chat
	var chatText = document.getElementById('chat-text');
	var chatInput = document.getElementById('chat-input');
	var chatForm = document.getElementById('chat-form');
	
	socket.on('addToChat',function(data){
		chatText.innerHTML += '<div>' + data + '</div>';
	});
	socket.on('evalAnswer',function(data){
		console.log(data);
	});
	
	
	chatForm.onsubmit = function(e){
		e.preventDefault();
		if(chatInput.value[0] === '/')
			socket.emit('evalServer',chatInput.value.slice(1));
		else
			socket.emit('sendMsgToServer',chatInput.value);
		chatInput.value = '';		
	}
	
	//Jueguito
	var Img = {};
	Img.player = new Image();
	Img.player.src = '/client/img/player1.png';
	Img.bullet = new Image();
	Img.bullet.src = '/client/img/bullet2.png';
	Img.map = new Image();
	Img.map.src = '/client/img/map.png';
	
	var ctx = document.getElementById("ctx").getContext("2d");
	ctx.font = '30px Arial';
	
	var Player = function(initPack){
		var self = {};
		self.id = initPack.id;
		self.number = initPack.number;
		self.x = initPack.x;
		self.y = initPack.y;
		self.hp = initPack.hp;
		self.hpMax = initPack.hpMax;
		self.score = initPack.score;
		
		self.draw = function(){	
			var x = self.x - Player.list[selfId].x + WIDTH/2;
			var y = self.y - Player.list[selfId].y + HEIGHT/2;
			
			var hpWidth = 30 * self.hp / self.hpMax;
			ctx.fillStyle = 'red';
			ctx.fillRect(x - hpWidth/2,y - 40,hpWidth,4);
			
			var width = Img.player.width/6;
			var height = Img.player.height/6;
			
			
			ctx.drawImage(Img.player,
				0,0,Img.player.width,Img.player.height,
				x-width/2,y-height/2,width,height);
			
			//ctx.fillText(self.score,self.x,self.y-60);
		}
		
		Player.list[self.id] = self;
		
		
		return self;
	}
	Player.list = {};

		
	var Bullet = function(initPack){
		var self = {};
		self.id = initPack.id;
		self.x = initPack.x;
		self.y = initPack.y;
		
		self.draw = function(){			
			var width = Img.bullet.width/26;
			var height = Img.bullet.height/26;
			
			var x = self.x - Player.list[selfId].x + WIDTH/2;
			var y = self.y - Player.list[selfId].y + HEIGHT/2;
			
			ctx.drawImage(Img.bullet,
				0,0,Img.bullet.width,Img.bullet.height,
				x-width/2,y-height/2,width,height);
		}
		
		Bullet.list[self.id] = self;		
		return self;
	}
	Bullet.list = {};
	
	var selfId = null;

	socket.on('init',function(data){	
		if(data.selfId)
			selfId = data.selfId;
		//{ player : [{id:123,number:'1',x:0,y:0},{id:1,number:'2',x:0,y:0}], bullet: []}
		for(var i = 0 ; i < data.player.length; i++){
			new Player(data.player[i]);
		}
		for(var i = 0 ; i < data.bullet.length; i++){
			new Bullet(data.bullet[i]);
		}
	});
	
	socket.on('update',function(data){
		//{ player : [{id:123,x:0,y:0},{id:1,x:0,y:0}], bullet: []}
		for(var i = 0 ; i < data.player.length; i++){
			var pack = data.player[i];
			var p = Player.list[pack.id];
			if(p){
				if(pack.x !== undefined)
					p.x = pack.x;
				if(pack.y !== undefined)
					p.y = pack.y;
				if(pack.hp !== undefined)
					p.hp = pack.hp;
				if(pack.score !== undefined)
					p.score = pack.score;
			}
		}
		for(var i = 0 ; i < data.bullet.length; i++){
			var pack = data.bullet[i];
			var b = Bullet.list[data.bullet[i].id];
			if(b){
				if(pack.x !== undefined)
					b.x = pack.x;
				if(pack.y !== undefined)
					b.y = pack.y;
			}
		}
	});
	
	socket.on('remove',function(data){
		//{player:[12323],bullet:[12323,123123]}
		for(var i = 0 ; i < data.player.length; i++){
			delete Player.list[data.player[i]];
		}
		for(var i = 0 ; i < data.bullet.length; i++){
			delete Bullet.list[data.bullet[i]];
		}
	});
	
	setInterval(function(){
		if(!selfId)
			return;
		ctx.clearRect(0,0,500,500);
		drawMap();
		drawScore();
		for(var i in Player.list)
			Player.list[i].draw();
		for(var i in Bullet.list)
			Bullet.list[i].draw();
	},40);
	
	var drawMap = function(){
		var x = WIDTH/2 - Player.list[selfId].x;
		var y = HEIGHT/2 - Player.list[selfId].y;
		ctx.drawImage(Img.map,x,y);
	}
	
	var drawScore = function(){
		ctx.fillStyle = 'white';
		ctx.fillText(Player.list[selfId].score,0,30);
	}
	
	document.onkeydown = function(event){
		if(event.keyCode === 68)	//d
			socket.emit('keyPress',{inputId:'right',state:true});
		else if(event.keyCode === 83)	//s
			socket.emit('keyPress',{inputId:'down',state:true});
		else if(event.keyCode === 65) //a
			socket.emit('keyPress',{inputId:'left',state:true});
		else if(event.keyCode === 87) // w
			socket.emit('keyPress',{inputId:'up',state:true});
			
	}
	document.onkeyup = function(event){
		if(event.keyCode === 68)	//d
			socket.emit('keyPress',{inputId:'right',state:false});
		else if(event.keyCode === 83)	//s
			socket.emit('keyPress',{inputId:'down',state:false});
		else if(event.keyCode === 65) //a
			socket.emit('keyPress',{inputId:'left',state:false});
		else if(event.keyCode === 87) // w
			socket.emit('keyPress',{inputId:'up',state:false});
	}
	
	document.onmousedown = function(event){
		socket.emit('keyPress',{inputId:'attack',state:true});
	}
	document.onmouseup = function(event){
		socket.emit('keyPress',{inputId:'attack',state:false});
	}
	document.onmousemove = function(event){
		var x = -250 + event.clientX - 8;
		var y = -250 + event.clientY - 8;
		var angle = Math.atan2(y,x) / Math.PI * 180;
		socket.emit('keyPress',{inputId:'mouseAngle',state:angle});
	}
	