// create "Game" scene
let gameScene = new Phaser.Scene('Game');

// Scene parameters
gameScene.init = function() {
  this.playerSpeed = 1.5;
  this.enemyMaxY = 280;
  this.enemyMinY = 50;
}

// Resource loading
gameScene.preload = function() {
 
  // Image loading
  this.load.image('background', 'assets/background.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('dragon', 'assets/dragon.png');
  this.load.image('treasure', 'assets/treasure.png');
};
 
// Run one time after resource loading
gameScene.create = function() {
 
   // background
   let bg = this.add.sprite(0, 0, 'background');

   this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

   // move Ox to up left angle
   bg.setOrigin(0,0);

   // player
  this.player = this.add.sprite(40, this.sys.game.config.height / 2, 'player');
 
  // decrease scale
  this.player.setScale(0.5);

  // destination
  this.treasure = this.add.sprite(this.sys.game.config.width - 80, this.sys.game.config.height / 2, 'treasure');
  this.treasure.setScale(0.6);

  // Enemies group
  this.enemies = this.add.group({
    key: 'dragon',
    repeat: 5,
    setXY: {
      x: 110,
      y: 100,
      stepX: 80,
      stepY: 20
    }
  });

  // Enemy scale
  Phaser.Actions.ScaleXY(this.enemies.getChildren(), -0.5, -0.5);

  // Enemiy speed
  Phaser.Actions.Call(this.enemies.getChildren(), function(enemy) {
    enemy.speed = Math.random() * 2 + 1;
  }, this);

  // Flag Player is alive
  this.isPlayerAlive = true;

  // Reset camera effects
  this.cameras.main.resetFX();

  this.startTime = Date.now();
  this.elapsedTimeText = this.add.text(10, 10, 'Time: 0', { fontSize: '16px', color: '#ffffff' });

}; // create END

// update 60 time per second
gameScene.update = function() {
  // if player is alive
  if (!this.isPlayerAlive) {
    return;
  }
 
  // check input
  if (this.spacebar.isDown || this.input.activePointer.isDown) {
 
    // player moves ahead
    this.player.x += this.playerSpeed;
  }

  // check player reach treasure
  if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.treasure.getBounds())) {
    this.gameOver();
  }

  // enemy's move
  let enemies = this.enemies.getChildren();
  let numEnemies = enemies.length;
 
  for (let i = 0; i < numEnemies; i++) {
 
    // move ever enemy
    enemies[i].y += enemies[i].speed;
 
    // revert move when enemy reach a border
    if (enemies[i].y >= this.enemyMaxY && enemies[i].speed > 0) {
      enemies[i].speed *= -1;
    } else if (enemies[i].y <= this.enemyMinY && enemies[i].speed < 0) {
      enemies[i].speed *= -1;
    }

     // player touch with enemy
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), enemies[i].getBounds())) {
      this.gameOver();
      break;
    }
  }

  // time update
  if (this.startTime !== null) {
    const elapsedMs = Date.now() - this.startTime;
    const seconds = Math.floor(elapsedMs / 1000);
    const milliseconds = elapsedMs % 1000;
    this.elapsedTimeText.setText(`Time: ${seconds}:${milliseconds.toString().padStart(3, '0')}`);
  }


}; // update END

// game over
gameScene.gameOver = function() {
  // set flag Plyer is dead
  this.isPlayerAlive = false;

  // camera shake
  this.cameras.main.shake(500);

  // print time
  const elapsedMs = Date.now() - this.startTime;
  const seconds = Math.floor(elapsedMs / 1000);
  const milliseconds = elapsedMs % 1000;
  this.elapsedTimeText.setText(`Time: ${seconds}:${milliseconds.toString().padStart(3, '0')}\nGame Over`);
  this.startTime = null;  //  Stop updating the timer

  // Position the text in the center of the screen and enlarge it
  this.elapsedTimeText.setPosition(this.sys.game.config.width / 2 - this.elapsedTimeText.width / 2, this.sys.game.config.height / 2 - this.elapsedTimeText.height / 2);
  this.elapsedTimeText.setFontSize(32);

  // Add a "share tweet" button
  let shareTweetButton = this.add.text(this.sys.game.config.width / 2 - 100, this.sys.game.config.height / 2 + 50, 'Share Tweet', { fontSize: '24px', color: '#ffffff', backgroundColor: '#1da1f2', padding: {left: 10, right: 10, top: 5, bottom: 5} });
  shareTweetButton.setInteractive({ useHandCursor: true });
  shareTweetButton.on('pointerup', () => {
    // Capture a screenshot
    this.captureScreenshot((screenshot) => {
      // Upload the screenshot to local storage
      this.uploadToLocal(screenshot, (error, localUrl) => {
        if (error) {
          console.error('Error uploading image to local storage:', error);
          return;
        }
  
        // Prepare tweet text
        let tweetText = encodeURIComponent("I just played this cool game! Check out my score!");
  
        // Create tweet sharing URL
        let tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(localUrl)}`;
  
        // Open the tweet sharing URL in a new window
        window.open(tweetUrl, '_blank');
      });
    });
  });
  
  this.input.keyboard.once('keydown-SPACE', this.restartGame, this);
}

gameScene.uploadToLocal = function(imageData, callback) {
  try {
    localStorage.setItem('game-screenshot', imageData);
    const localUrl = URL.createObjectURL(dataURItoBlob(imageData));
    callback(null, localUrl);
  } catch (error) {
    callback(error);
  }
};

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}





gameScene.restartGame = function() {
  // Reset elapsedTimeText position and size
  this.elapsedTimeText.setPosition(10, 10);
  this.elapsedTimeText.setFontSize(16);

  // Resume the scene and restart it
  this.scene.resume();
  this.scene.restart();
}

gameScene.captureScreenshot = function(callback) {
  this.game.renderer.snapshot((image) => {
    callback(image.src);
  });
}


 
// game configuration
let config = {
  type: Phaser.AUTO,  // Phaser decides how to visualize our game (WebGL или Canvas)
  width: 640, // game widht
  height: 360, // game height
  scene: gameScene // our created scene
};
 
// Game create with apply configuration
let game = new Phaser.Game(config);