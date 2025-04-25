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
let isPumping = false; // Flag to prevent pump spamming

const game = new Phaser.Game(config);

function preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("pumpBase", "assets/pumpBase.png");
    this.load.image("pumpHandle", "assets/pumpHandle.png");
    this.load.image("pumpPipe", "assets/pumpPipe.png");
    this.load.image("balloonBurst", "assets/balloonBurst.png");
    this.load.image("balloonString", "assets/balloonString.png");

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

    // Create initial balloon at the pump
    spawnNewBalloon.call(this, pumpX - 425, pumpY - 205);

    pumpHandle = this.add.image(pumpX, pumpY - 300, "pumpHandle").setInteractive();
    pumpHandle.setDepth(3);
    pumpBase = this.add.image(pumpX - 300, pumpY - 50, "pumpPipe");
    pumpBase.setDepth(3);
    pumpPipe = this.add.image(pumpX, pumpY, "pumpBase");
    pumpPipe.setDepth(3);

    pumpHandle.on('pointerdown', () => {
        // Prevent pump spamming
        if (isPumping) return;
        
        isPumping = true;
        animatePumpHandle.call(this);
        
        if (activeBalloon && !activeBalloon.isFlying && !activeBalloon.bursted) {
            inflateBalloon.call(this, activeBalloon);
        }
        
        // Reset pumping flag after animation completes
        this.time.delayedCall(150, () => {
            isPumping = false;
        });
    });

    this.input.on('gameobjectdown', (pointer, obj) => {
        let found = balloons.find(b => b.sprite === obj);
        if (found && found.isFlying && !found.bursted) {
            burstBalloon.call(this, found);
        }
    });
}

function update() {
    balloons.forEach(balloon => {
        if (balloon.isFlying && !balloon.bursted) {
            // Move the balloon
            balloon.sprite.x += balloon.velocity.x;
            balloon.sprite.y += balloon.velocity.y;

            // Always update letter and string position to match balloon position
            updateAttachments(balloon);

            // Bounce off the edges
            if (balloon.sprite.x < 50 || balloon.sprite.x > config.width - 50)
                balloon.velocity.x *= -1;
            if (balloon.sprite.y < 50 || balloon.sprite.y > config.height - 50)
                balloon.velocity.y *= -1;
        }
    });
}

// Updated helper function to update both letter and string positions
function updateAttachments(balloon) {
    // Update letter position
    if (balloon.letter && balloon.letter.active) {
        balloon.letter.x = balloon.sprite.x;
        balloon.letter.y = balloon.sprite.y;
    }
    
    // Update string position
    if (balloon.string && balloon.string.active) {
        balloon.string.x = balloon.sprite.x;
        // String should hang below the balloon
        balloon.string.y = balloon.sprite.y + (balloon.sprite.displayHeight / 2);
    }
}

// Function to handle balloon bursting
function burstBalloon(balloon) {
    balloon.bursted = true;
    balloon.sprite.setTexture("balloonBurst");

    // Make sure to destroy the letter when the balloon bursts
    if (balloon.letter && balloon.letter.active) {
        balloon.letter.destroy();
        balloon.letter = null;
    }
    
    // Make sure to destroy the string when the balloon bursts
    if (balloon.string && balloon.string.active) {
        balloon.string.destroy();
        balloon.string = null;
    }

    // Remove the burst balloon after animation
    this.time.delayedCall(400, () => {
        if (balloon.sprite && balloon.sprite.active) {
            balloon.sprite.destroy();
        }
        balloons = balloons.filter(b => b !== balloon);
    });
}

function animatePumpHandle() {
    const originalY = pumpY - 300;

    this.tweens.add({
        targets: pumpHandle,
        y: originalY + 70,
        duration: 100,
        yoyo: true,
        ease: "Power2",
        onComplete: () => {
            pumpHandle.y = originalY;
        }
    });

    this.tweens.add({
        targets: pumpBase,
        scaleY: 0.95,
        scaleX: 1.05,
        duration: 100,
        yoyo: true,
        ease: "Sine.easeInOut",
        onComplete: () => {
            pumpBase.setScale(1);
            pumpPipe.setScale(1);
        }
    });
    this.tweens.add({
        targets:  pumpPipe,
        scaleY: 0.8,
        scaleX: 1.1,
        duration: 100,
        yoyo: true,
        ease: "Sine.easeInOut",
        onComplete: () => {
            pumpBase.setScale(1);
            pumpPipe.setScale(1);
        }
    });

}

function spawnNewBalloon(x, y) {
    // Only spawn a new balloon if there isn't already an active one at the pump
    if (activeBalloon && !activeBalloon.isFlying && !activeBalloon.bursted) {
        return; // Don't create a new balloon if there's already one at the pump
    }
    
    const balloonKey = randomBalloonKey();
    const letterKey = randomLetterKey();
    
    const sprite = this.add.sprite(x, y, balloonKey).setInteractive();
    sprite.setScale(0.05);
    sprite.setDepth(1);

    // Create the letter at the same position as the balloon
    const letter = this.add.image(x, y, letterKey);
    letter.setScale(0.02);
    letter.setDepth(2); // Ensure letter is always on top of balloon
    
    // Initially there's no string - it will be added when the balloon flies
    let balloon = {
        sprite,
        letter,
        string: null, // String will be added later when balloon starts flying
        inflation: 0,
        isFlying: false,
        bursted: false,
        velocity: { x: floatVelocity.x, y: floatVelocity.y },
        // Store initial position to track upward movement during inflation
        initialY: y
    };

    balloons.push(balloon);
    activeBalloon = balloon;
}

function inflateBalloon(balloon) {
    if (balloon.inflation >= maxInflation) return;

    balloon.inflation++;

    // Calculate new scale based on inflation level
    const newBalloonScale = 0.05 + (balloon.inflation * 0.05);
    const newLetterScale = newBalloonScale * 0.4;

    // Calculate upward movement based on inflation level
    // More upward movement with each pump to simulate balloon wanting to float
    const upwardMovement = 10 * balloon.inflation;
    const newY = balloon.initialY - upwardMovement;

    // Create an overshoot effect for the inflation
    const overshootScale = newBalloonScale * 1.1;
    
    // First, quickly inflate the balloon beyond target scale
    this.tweens.add({
        targets: balloon.sprite,
        scale: overshootScale,
        duration: 70,
        ease: "Sine.easeOut",
        onComplete: () => {
            // Then settle back to target scale with elastic effect
            this.tweens.add({
                targets: balloon.sprite,
                scale: newBalloonScale,
                duration: 80,
                ease: "Elastic.easeOut",
                onComplete: () => {
                    if (balloon.inflation >= maxInflation) {
                        // Final release animation
                        releaseFullyInflatedBalloon.call(this, balloon);
                    }
                }
            });
        }
    });

    // Move balloon upward with each pump
    this.tweens.add({
        targets: [balloon.sprite, balloon.letter],
        y: newY,
        duration: 150,
        ease: "Sine.easeOut"
    });

    // Update letter scale with balloon
    this.tweens.add({
        targets: balloon.letter,
        scale: newLetterScale,
        duration: 150,
        ease: "Sine.easeInOut"
    });
    
    // Add a slight wobble effect to show the inflation pressure
    if (balloon.inflation > 1) {
        this.tweens.add({
            targets: [balloon.sprite, balloon.letter],
            angle: Phaser.Math.Between(-3, 3),
            duration: 100,
            ease: "Sine.easeInOut"
        });
    }
}

// New function to handle the final release of a fully inflated balloon
function releaseFullyInflatedBalloon(balloon) {
    // Add string before balloon flies away
    addStringToBalloon.call(this, balloon);
    
    // Final upward boost animation
    this.tweens.add({
        targets: [balloon.sprite, balloon.letter, balloon.string],
        y: '-=30', // Move up by 30 pixels from current position
        angle: Phaser.Math.Between(-5, 5), // Add some rotation
        duration: 300,
        ease: "Back.easeOut",
        onComplete: () => {
            // Randomize velocity for floating motion
            balloon.velocity = {
                x: Phaser.Math.Between(-2, 2),
                y: Phaser.Math.Between(-3, -1)
            };

            balloon.isFlying = true;
            
            // Clear active balloon reference
            activeBalloon = null;
            
            // Spawn a new balloon at the pump after a slight delay
            this.time.delayedCall(200, () => {
                spawnNewBalloon.call(this, pumpX - 425, pumpY - 205);
            });
        }
    });
}

// Function to add string to balloon
function addStringToBalloon(balloon) {
    // Only add a string if the balloon doesn't already have one
    if (balloon.string) return;
    
    // Calculate the position based on the balloon's current size
    const stringY = balloon.sprite.y + (balloon.sprite.displayHeight / 2);
    const string = this.add.image(balloon.sprite.x, stringY, "balloonString");
    
    // Scale the string appropriately based on balloon size
    const stringScale = balloon.sprite.scale * 0.7;
    string.setScale(stringScale);
    
    // Make sure string is behind balloon but in front of background
    string.setDepth(0.5);
    
    // Store the string reference in the balloon object
    balloon.string = string;
    
    // Add a slight swing animation to the string
    this.tweens.add({
        targets: string,
        angle: 8,
        duration: 300,
        yoyo: true,
        repeat: 1,
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