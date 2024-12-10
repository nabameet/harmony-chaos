let particles = [];
let currentTool = 'heal';
let analyticsData = {
    healActions: 0,
    traumaActions: 0,
    totalInteractions: 0,
    lastAverageEntropy: 0
};
let affectedParticles = [];
let toolRadius = 100;
let toolStrength = 0.2;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Initialize particles with random entropy
    for (let i = 0; i < 200; i++) {
        particles.push(new Particle(
            random(width),
            random(height)
        ));
    }

    // Setup UI controls
    setupControls();
}

function setupControls() {
    const healBtn = document.getElementById('healTool');
    const traumaBtn = document.getElementById('traumaTool');
    const freezeBtn = document.getElementById('freezeBtn');
    const analyticsBtn = document.getElementById('analyticsBtn');
    const modal = document.getElementById('analytics-modal');
    const closeBtn = document.querySelector('.close');

    // Set initial active state
    healBtn.classList.add('active');

    healBtn.addEventListener('click', () => {
        currentTool = 'heal';
        healBtn.classList.add('active');
        traumaBtn.classList.remove('active');
    });

    traumaBtn.addEventListener('click', () => {
        currentTool = 'trauma';
        traumaBtn.classList.add('active');
        healBtn.classList.remove('active');
    });

    freezeBtn.addEventListener('click', () => {
        saveCanvas('harmony-chaos', 'png');
    });

    analyticsBtn.addEventListener('click', () => {
        updateAnalyticsChart();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function draw() {
    background(0, 20);

    // Calculate average entropy for analytics
    let totalEntropy = 0;
    particles.forEach(p => totalEntropy += p.entropy);
    analyticsData.lastAverageEntropy = totalEntropy / particles.length;

    // Draw tool cursor
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        push();
        noFill();
        strokeWeight(2);
        
        if (currentTool === 'heal') {
            // Draw healing circle cursor
            stroke(75, 192, 192, 200);
            circle(mouseX, mouseY, toolRadius * 2);
            
            // Draw inner rotating circles for heal effect
            push();
            translate(mouseX, mouseY);
            rotate(frameCount * 0.02);
            for (let i = 0; i < 3; i++) {
                rotate(TWO_PI / 3);
                circle(20, 0, 10);
            }
            pop();
        } else {
            // Draw trauma star cursor
            stroke(255, 99, 132, 200);
            push();
            translate(mouseX, mouseY);
            rotate(frameCount * 0.02);
            for (let i = 0; i < 8; i++) {
                line(0, -toolRadius + 10, 0, -toolRadius);
                rotate(TWO_PI / 8);
            }
            pop();
        }
        pop();
    }

    // Update and display particles
    for (let i = 0; i < particles.length; i++) {
        // Check neighborhood before updating
        particles[i].checkNeighborhood(particles);
        
        particles[i].update();
        particles[i].show();
        
        // Check for interactions with other particles
        for (let j = i + 1; j < particles.length; j++) {
            if (particles[i].interact(particles[j])) {
                analyticsData.totalInteractions++;
            }
        }
    }

    // Handle mouse interaction
    if (mouseIsPressed && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        const mousePos = createVector(mouseX, mouseY);
        
        particles.forEach(p => {
            const d = p5.Vector.dist(p.pos, mousePos);
            if (d < toolRadius) {
                let oldEntropy = p.entropy;
                
                if (currentTool === 'heal') {
                    p.heal(toolStrength * (1 - d/toolRadius));
                    if (oldEntropy !== p.entropy) {
                        analyticsData.healActions++;
                        affectedParticles.push({
                            pos: p.pos.copy(),
                            type: 'heal',
                            frame: frameCount,
                            strength: 1 - d/toolRadius
                        });
                    }
                } else {
                    p.traumatize(toolStrength * (1 - d/toolRadius));
                    if (oldEntropy !== p.entropy) {
                        analyticsData.traumaActions++;
                        affectedParticles.push({
                            pos: p.pos.copy(),
                            type: 'trauma',
                            frame: frameCount,
                            strength: 1 - d/toolRadius
                        });
                    }
                }
            }
        });
    }

    // Draw effects for affected particles
    for (let i = affectedParticles.length - 1; i >= 0; i--) {
        const effect = affectedParticles[i];
        const age = frameCount - effect.frame;
        
        if (age > 30) {
            affectedParticles.splice(i, 1);
            continue;
        }

        push();
        noFill();
        const alpha = map(age, 0, 30, 255, 0);
        const size = map(age, 0, 30, 10, 40) * effect.strength;
        
        if (effect.type === 'heal') {
            stroke(75, 192, 192, alpha);
            circle(effect.pos.x, effect.pos.y, size);
            
            // Add extra healing effect
            push();
            translate(effect.pos.x, effect.pos.y);
            rotate(age * 0.2);
            for (let j = 0; j < 3; j++) {
                rotate(TWO_PI / 3);
                circle(size/4, 0, size/4);
            }
            pop();
        } else {
            stroke(255, 99, 132, alpha);
            push();
            translate(effect.pos.x, effect.pos.y);
            rotate(age * 0.2);
            for (let j = 0; j < 4; j++) {
                line(0, -size/2, 0, -size);
                rotate(TWO_PI / 4);
            }
            pop();
        }
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 