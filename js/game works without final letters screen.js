// создаем новую сцену с именем "Game"
let gameScene = new Phaser.Scene('Game');

// некоторые параметры для нашей сцены (это наши собственные переменные - они НЕ являются частью Phaser API)
gameScene.init = function() {
  this.playerSpeed = 1.5;
  this.enemyMaxY = 280;
  this.enemyMinY = 50;
}

// загрузка файлов ресурсов для нашей игры
gameScene.preload = function() {
 
  // загрузка изображений
  this.load.image('background', 'assets/background.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('dragon', 'assets/dragon.png');
  this.load.image('treasure', 'assets/treasure.png');
};

// выполняется один раз, после загрузки ресурсов
gameScene.create = function() {
 
   // фон
   let bg = this.add.sprite(0, 0, 'background');

   this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

   // перемещаем начальную точку в верхний левый угол
   bg.setOrigin(0,0);

   // игрок
  this.player = this.add.sprite(40, this.sys.game.config.height / 2, 'player');
 
  // уменьшить масштаб
  this.player.setScale(0.5);

  // место назначения
  this.treasure = this.add.sprite(this.sys.game.config.width - 80, this.sys.game.config.height / 2, 'treasure');
  this.treasure.setScale(0.6);

  // группа врагов
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

  // масштабируем врагов
  Phaser.Actions.ScaleXY(this.enemies.getChildren(), -0.5, -0.5);

  // задаем скорость врагов
  Phaser.Actions.Call(this.enemies.getChildren(), function(enemy) {
    enemy.speed = Math.random() * 2 + 1;
  }, this);

  // флаг, что игрок жив
  this.isPlayerAlive = true;

  // сброс эффектов камеры
  this.cameras.main.resetFX();

  this.startTime = Date.now();
  this.elapsedTimeText = this.add.text(10, 10, 'Time: 0', { fontSize: '16px', color: '#ffffff' });

}; // create END

// выполняется каждый кадр (ориентировочно 60 раз в секунду)
gameScene.update = function() {
  // выполняем код, если игрок жив
  if (!this.isPlayerAlive) {
    return;
  }
 
  // проверяем активный ввод 
  if (this.spacebar.isDown || this.input.activePointer.isDown) {
 
    // игрок перемещается вперед
    this.player.x += this.playerSpeed;
  }

  // проверка на столкновение с сокровищем
  if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.treasure.getBounds())) {
    this.gameOver();
  }

  // движение врагов
  let enemies = this.enemies.getChildren();
  let numEnemies = enemies.length;
 
  for (let i = 0; i < numEnemies; i++) {
 
    // перемещаем каждого из врагов
    enemies[i].y += enemies[i].speed;
 
    // разворачиваем движение, если враг достиг границы
    if (enemies[i].y >= this.enemyMaxY && enemies[i].speed > 0) {
      enemies[i].speed *= -1;
    } else if (enemies[i].y <= this.enemyMinY && enemies[i].speed < 0) {
      enemies[i].speed *= -1;
    }

     // столкновение с врагами
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), enemies[i].getBounds())) {
      this.gameOver();
      break;
    }
  }

  // обновление времени на экране
  // const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
  // this.elapsedTimeText.setText(`Time: ${elapsedTime}`);
  if (this.startTime !== null) {
    const elapsedMs = Date.now() - this.startTime;
    const seconds = Math.floor(elapsedMs / 1000);
    const milliseconds = elapsedMs % 1000;
    this.elapsedTimeText.setText(`Time: ${seconds}:${milliseconds.toString().padStart(3, '0')}`);
  }


}; // update END

// конец игры
gameScene.gameOver = function() {
  // устанавливаем флаг, что игрок умер
  this.isPlayerAlive = false;
 
  // дрожание камеры
  this.cameras.main.shake(500);

  // вывод времени игры
  const elapsedMs = Date.now() - this.startTime;
  const seconds = Math.floor(elapsedMs / 1000);
  const milliseconds = elapsedMs % 1000;
  this.elapsedTimeText.setText(`Time: ${seconds}:${milliseconds.toString().padStart(3, '0')}\nGame Over`);
  this.startTime = null;  //  Stop updating the timer

  // затухание камеры через 250мс
  this.time.delayedCall(250, function() {
    this.cameras.main.fade(250);
  }, [], this);
 
  // перезапускаем сцену через 500мс
  this.time.delayedCall(500, function() {
    this.scene.restart();
  }, [], this);
}
 
// конфигурация нашей игры
let config = {
  type: Phaser.AUTO,  // Phaser сам решает как визуализировать нашу игру (WebGL или Canvas)
  width: 640, // ширина игры
  height: 360, // высота игры
  scene: gameScene // наша созданная выше сцена
};
 
// создаем игру и передам ей конфигурацию
let game = new Phaser.Game(config);
