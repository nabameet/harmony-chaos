class Particle {
    constructor(x, y, entropy = random(0, 1)) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector(0, 0);
        this.entropy = entropy;
        this.radius = 5;
        this.wanderAngle = random(TWO_PI);
        this.lastUpdate = millis();
        this.neighborhoodRadius = 50; // Radius to check for neighbors
        this.updateProperties();
    }

    updateProperties() {
        // Speed scales with entropy, but never quite reaches 0 unless all nearby particles are calm
        this.maxSpeed = map(this.entropy, 0, 1, 0.5, 6);
        this.color = this.getColorFromEntropy();
    }

    getColorFromEntropy() {
        // Interpolate between calm (blue) and chaotic (red) colors
        return color(
            map(this.entropy, 0, 1, 100, 255),  // Red increases with entropy
            map(this.entropy, 0, 1, 200, 30),   // Green decreases with entropy
            map(this.entropy, 0, 1, 255, 50)    // Blue decreases with entropy
        );
    }

    applyForce(force) {
        this.acc.add(force);
    }

    // Check neighborhood entropy levels
    checkNeighborhood(particles) {
        let neighborCount = 0;
        let totalNeighborEntropy = 0;
        
        for (let other of particles) {
            if (other !== this) {
                let d = p5.Vector.dist(this.pos, other.pos);
                if (d < this.neighborhoodRadius) {
                    neighborCount++;
                    totalNeighborEntropy += other.entropy;
                }
            }
        }
        
        // If there are neighbors, calculate average neighborhood entropy
        if (neighborCount > 0) {
            let avgNeighborEntropy = totalNeighborEntropy / neighborCount;
            
            // If both this particle and its neighbors are very calm (entropy < 0.1)
            // gradually move towards complete order
            if (this.entropy < 0.1 && avgNeighborEntropy < 0.1) {
                this.entropy = max(0, this.entropy - 0.001);
                if (this.entropy === 0) {
                    this.vel.mult(0);
                }
            } else {
                // Prevent reaching absolute zero unless neighbors are also calm
                this.entropy = max(0.01, this.entropy);
            }
        }
        
        this.updateProperties();
    }

    interact(other) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d < this.radius * 2) {
            // Calculate collision force (higher at higher speeds)
            let relativeSpeed = p5.Vector.sub(this.vel, other.vel).mag();
            let collisionForce = map(relativeSpeed, 0, 10, 0.02, 0.1);
            
            // Exchange entropy based on collision force
            let entropyDiff = this.entropy - other.entropy;
            let entropyExchange = entropyDiff * collisionForce * 0.2;
            
            // Add minimal randomness to the exchange
            entropyExchange += random(-0.01, 0.01) * collisionForce;
            
            // Update entropies with smaller changes
            let newEntropy = constrain(this.entropy - entropyExchange * 0.3, 0.01, 1);
            let otherNewEntropy = constrain(other.entropy + entropyExchange * 0.3, 0.01, 1);
            
            // Only update if the change is significant enough
            if (abs(newEntropy - this.entropy) > 0.001) {
                this.entropy = newEntropy;
                this.updateProperties();
            }
            if (abs(otherNewEntropy - other.entropy) > 0.001) {
                other.entropy = otherNewEntropy;
                other.updateProperties();
            }
            
            // Velocity influence
            let angle = p5.Vector.sub(other.pos, this.pos).heading();
            this.vel.rotate((noise(frameCount * 0.01) - 0.5) * PI * this.entropy * 0.3);
            
            return true;
        }
        return false;
    }

    wander() {
        this.wanderAngle = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01) * TWO_PI * 2;
        let wanderForce = createVector(cos(this.wanderAngle), sin(this.wanderAngle));
        wanderForce.mult(0.1);
        return wanderForce;
    }

    update() {
        let currentTime = millis();
        let deltaTime = (currentTime - this.lastUpdate) / 1000;
        this.lastUpdate = currentTime;

        // Apply forces based on entropy level
        let wanderForce = this.wander();
        wanderForce.mult(map(this.entropy, 0, 1, 1, 3));
        this.applyForce(wanderForce);
        
        // Random direction changes based on entropy
        if (random() < this.entropy * 0.02) {
            this.vel.rotate(random(-PI/4, PI/4) * this.entropy);
        }

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel.copy().mult(deltaTime * 60));
        this.acc.mult(0);

        this.pos.x = (this.pos.x + width) % width;
        this.pos.y = (this.pos.y + height) % height;
    }

    show() {
        noStroke();
        fill(this.color);
        
        // Size pulsing based on entropy
        let pulseAmount = map(this.entropy, 0, 1, 0, 0.3);
        let pulseSize = this.radius * (1 + sin(frameCount * 0.1) * pulseAmount);
        circle(this.pos.x, this.pos.y, pulseSize * 2);
    }

    heal(amount = 0.2) {
        this.entropy = max(0.01, this.entropy - amount);
        this.updateProperties();
    }

    traumatize(amount = 0.2) {
        this.entropy = min(1, this.entropy + amount);
        this.updateProperties();
    }
} 