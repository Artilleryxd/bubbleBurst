const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#fff",
    scene: {
        preload,
        create,
        update
    }
};

let balloons = [];
let pumpHandle;
let pumpX, pumpY;
let floatVelocity = { x: 1, y: -1 };
let maxInflation = 5;
let activeBalloon = null;

const game = new Phaser.Game(config);

function preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("pumpBase", "assets/pumpBase.png");
    this.load.image("pumpHandle", "assets/pumpHandle.png");
    this.load.image("pumpPipe", "assets/pumpPipe.png");
    this.load.image("balloonString", "assets/pumpPipe.png");
    this.load.image("balloonBurst", "assets/balloonBurst.png");

    for (let i = 1; i <= 10; i++) {
        this.load.image(`balloon${i}`, `assets/Symbol_10000${i}.png`);
    }
    for (let i = 1; i <= 9; i++) {
        this.load.image(`letter${i}`, `assets/Symbol_1000${i}.png`);
    }
    for (let i = 10; i <= 26; i++) {
        this.load.image(`letter${i}`, `assets/Symbol_100${i}.png`);
    }
}

function create() {
    this.add.image(0, 0, "background").setOrigin(0, 0);

    pumpX = config.width - 180;
    pumpY = config.height - 180;

    spawnNewBalloon.call(this, pumpX - 425, pumpY - 200);

    pumpHandle = this.add.image(pumpX, pumpY - 300, "pumpHandle").setInteractive();
    pumpHandle.setDepth(1);
    this.add.image(pumpX - 300, pumpY - 50, "pumpPipe").setDepth(1);
    this.add.image(pumpX, pumpY, "pumpBase").setDepth(1);

    pumpHandle.on('pointerdown', () => {
        animatePumpHandle.call(this);
        if (activeBalloon && !activeBalloon.isFlying && !activeBalloon.bursted) {
            inflateBalloon.call(this, activeBalloon);
        }
    });

    this.input.on('gameobjectdown', (pointer, obj) => {
        let found = balloons.find(b => b.sprite === obj);
        if (found && found.isFlying && !found.bursted) {
            found.bursted = true;
            obj.setTexture("balloonBurst");

            found.letter.destroy();
            this.time.delayedCall(400, () => {
                obj.destroy();
                balloons = balloons.filter(b => b.sprite !== obj);
            });
        }
    });
}

function update() {
    balloons.forEach(balloon => {
        if (balloon.isFlying && !balloon.bursted) {
            balloon.sprite.x += balloon.velocity.x;
            balloon.sprite.y += balloon.velocity.y;

            // Keep the letter centered on the balloon
            balloon.letter.x = balloon.sprite.x;
            balloon.letter.y = balloon.sprite.y;

            // Scale the letter based on the balloon's inflation
            const letterScale = balloon.sprite.scale * 0.2 + balloon.inflation * 0.02; // Adjust multiplier for desired effect
            balloon.letter.setScale(letterScale);

            if (balloon.sprite.x < 50 || balloon.sprite.x > config.width - 50)
                balloon.velocity.x *= -1;
            if (balloon.sprite.y < 50 || balloon.sprite.y > config.height - 50)
                balloon.velocity.y *= -1;
        }
    });
}

function animatePumpHandle() {
    const originalY = pumpY - 300;

    this.tweens.add({
        targets: pumpHandle,
        y: originalY + 40,
        duration: 70,
        yoyo: true,
        ease: "Power2",
        onComplete: () => {
            pumpHandle.y = originalY;
        }
    });
}

function spawnNewBalloon(x, y) {
    const balloonKey = randomBalloonKey();
    const letterKey = randomLetterKey();

    const sprite = this.add.sprite(x, y, balloonKey).setInteractive();
    sprite.setScale(0.05);
    sprite.setDepth(0);

    const letter = this.add.image(x, y - 2, letterKey); // Adjust letter's position slightly upwards
    letter.setScale(0.02); // 
    letter.setDepth(0.5);

    let balloon = {
        sprite,
        letter,
        inflation: 0,
        isFlying: false,
        bursted: false,
        velocity: { x: floatVelocity.x, y: floatVelocity.y }
    };

    balloons.push(balloon);
    activeBalloon = balloon;
}

function inflateBalloon(balloon) {
    if (balloon.inflation >= maxInflation) return;

    balloon.inflation++;

    setTimeout(() => {
    
    }, 200);

    this.tweens.add({
        targets: balloon.sprite,
        scale: balloon.sprite.scale + 0.05,
        duration: 150,
        ease: "Sine.easeInOut",
        onComplete: () => {
            if (balloon.inflation >= maxInflation) {
                balloon.velocity = {
                    x: Phaser.Math.Between(-2, 2),
                    y: Phaser.Math.Between(-3, -1)
                };

                balloon.isFlying = true;
                spawnNewBalloon.call(this, pumpX - 425, pumpY - 200);
            }
        }
    });

    this.tweens.add({
        targets: balloon.letter,
        scale: balloon.letter.scale + 0.03,
        duration: 150,
        ease: "Sine.easeInOut"
    });
}

function randomBalloonKey() {
    let randomIndex = Math.floor(Math.random() * 10) + 1;
    return `balloon${randomIndex}`;
}

function randomLetterKey() {
    let index = Phaser.Math.Between(1, 26);
    return `letter${index}`;
}
