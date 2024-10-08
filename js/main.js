var Boid = function () {

    var vector = new THREE.Vector3(),
        _acceleration, _width = 300,
        _height = 300,
        _depth = 100,
        _goal, _neighborhoodRadius = 100,
        _maxSpeed = 4,
        _maxSteerForce = 0.1,
        _avoidWalls = false;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    _acceleration = new THREE.Vector3();

    this.setGoal = function (target) {

        _goal = target;

    };

    this.setAvoidWalls = function (value) {

        _avoidWalls = value;

    };

    this.setWorldSize = function (width, height, depth) {

        _width = width;
        _height = height;
        _depth = depth;

    };

    this.run = function (boids) {

        if (_avoidWalls) {

            vector.set(-_width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);

            vector.set(_width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);

            vector.set(this.position.x, -_height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);

            vector.set(this.position.x, _height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);

            vector.set(this.position.x, this.position.y, -_depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);

            vector.set(this.position.x, this.position.y, _depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);

        }
        /* else {
            
                                    this.checkBounds();
            
                                }
                                */

        if (Math.random() > 0.5) {

            this.flock(boids);

        }

        this.move();

    };

    this.flock = function (boids) {

        if (_goal) {

            _acceleration.add(this.reach(_goal, 0.005));

        }

        _acceleration.add(this.alignment(boids));
        _acceleration.add(this.cohesion(boids));
        _acceleration.add(this.separation(boids));

    };

    this.move = function () {

        this.velocity.add(_acceleration);

        var l = this.velocity.length();

        if (l > _maxSpeed) {

            this.velocity.divideScalar(l / _maxSpeed);

        }

        this.position.add(this.velocity);
        _acceleration.set(0, 0, 0);

    };

    this.checkBounds = function () {

        if (this.position.x > _width) this.position.x = -_width;
        if (this.position.x < -_width) this.position.x = _width;
        if (this.position.y > _height) this.position.y = -_height;
        if (this.position.y < -_height) this.position.y = _height;
        if (this.position.z > _depth) this.position.z = -_depth;
        if (this.position.z < -_depth) this.position.z = _depth;

    };

    //

    this.avoid = function (target) {

        var steer = new THREE.Vector3();

        steer.copy(this.position);
        steer.sub(target);

        steer.multiplyScalar(1 / this.position.distanceToSquared(target));

        return steer;

    };

    this.repulse = function (target) {

        var distance = this.position.distanceTo(target);

        if (distance < 150) {

            var steer = new THREE.Vector3();

            steer.subVectors(this.position, target);
            steer.multiplyScalar(0.5 / distance);

            _acceleration.add(steer);

        }

    };

    this.reach = function (target, amount) {

        var steer = new THREE.Vector3();

        steer.subVectors(target, this.position);
        steer.multiplyScalar(amount);

        return steer;

    };

    this.alignment = function (boids) {

        var count = 0;
        var velSum = new THREE.Vector3();

        for (var i = 0, il = boids.length; i < il; i++) {

            if (Math.random() > 0.6) continue;

            var boid = boids[i];
            var distance = boid.position.distanceTo(this.position);

            if (distance > 0 && distance <= _neighborhoodRadius) {

                velSum.add(boid.velocity);
                count++;

            }

        }

        if (count > 0) {

            velSum.divideScalar(count);

            var l = velSum.length();

            if (l > _maxSteerForce) {

                velSum.divideScalar(l / _maxSteerForce);

            }

        }

        return velSum;

    };

    this.cohesion = function (boids) {

        var count = 0;
        var posSum = new THREE.Vector3();
        var steer = new THREE.Vector3();

        for (var i = 0, il = boids.length; i < il; i++) {

            if (Math.random() > 0.6) continue;

            var boid = boids[i];
            var distance = boid.position.distanceTo(this.position);

            if (distance > 0 && distance <= _neighborhoodRadius) {

                posSum.add(boid.position);
                count++;

            }

        }

        if (count > 0) {

            posSum.divideScalar(count);

        }

        steer.subVectors(posSum, this.position);

        var l = steer.length();

        if (l > _maxSteerForce) {

            steer.divideScalar(l / _maxSteerForce);

        }

        return steer;

    };

    this.separation = function (boids) {

        var posSum = new THREE.Vector3();
        var repulse = new THREE.Vector3();

        for (var i = 0, il = boids.length; i < il; i++) {

            if (Math.random() > 0.6) continue;

            var boid = boids[i];
            var distance = boid.position.distanceTo(this.position);

            if (distance > 0 && distance <= _neighborhoodRadius) {

                repulse.subVectors(this.position, boid.position);
                repulse.normalize();
                repulse.divideScalar(distance);
                posSum.add(repulse);

            }

        }

        return posSum;

    };

};


var SCREEN_WIDTH = document.querySelector('.webgl').clientWidth,
    SCREEN_HEIGHT = document.querySelector('.webgl').clientHeight,
    SCREEN_WIDTH_HALF = SCREEN_WIDTH / 2,
    SCREEN_HEIGHT_HALF = SCREEN_HEIGHT / 2;

var targetDoc = document.querySelector('.webgl');

var camera, scene, renderer,
    birds, bird;

var boid, boids;

init();
animate();

document.querySelector('#audioPlay').addEventListener('click', () => {
    document.querySelector('#audioMp3').play()
})
document.querySelector('#audioPause').addEventListener('click', () => {
    document.querySelector('#audioMp3').pause()
})

function init() {

    camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
    camera.position.z = 400;

    scene = new THREE.Scene();

    birds = [];
    boids = [];

    for (var i = 0; i < 300; i++) {

        boid = boids[i] = new Boid();
        boid.position.x = Math.random() * 400 - 200;
        boid.position.y = Math.random() * 400 - 200;
        boid.position.z = Math.random() * 400 - 200;
        boid.velocity.x = Math.random() * 2 - 1;
        boid.velocity.y = Math.random() * 2 - 1;
        boid.velocity.z = Math.random() * 2 - 1;
        boid.setAvoidWalls(true);
        boid.setWorldSize(500, 500, 400);

        bird = birds[i] = new THREE.Mesh(new Bird(), new THREE.MeshBasicMaterial({
            color: Math.random() * 0x5C5C5C,
            side: THREE.DoubleSide
        }));
        bird.phase = Math.floor(Math.random() * 62.83);
        scene.add(bird);


    }

    renderer = new THREE.CanvasRenderer();
    renderer.setClearColor(0xEEEEEE);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.querySelector('.webgl').appendChild(renderer.domElement);


    //

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect =SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

}

function onDocumentMouseMove(event) {

    var x = event.clientX - targetDoc.getBoundingClientRect().left + targetDoc.scrollLeft;
    var y = event.clientY - targetDoc.getBoundingClientRect().top + targetDoc.scrollTop;
    var vector = new THREE.Vector3(x - SCREEN_WIDTH_HALF, -y + SCREEN_HEIGHT_HALF, 0);
  
    for (var i = 0, il = boids.length; i < il; i++) {

        boid = boids[i];

        vector.z = boid.position.z;

        boid.repulse(vector);

    }

}

//

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    for (var i = 0, il = birds.length; i < il; i++) {

        boid = boids[i];
        boid.run(boids);

        bird = birds[i];
        bird.position.copy(boids[i].position);

        var color = bird.material.color;
        color.r = color.g = color.b = (500 - bird.position.z) / 1000;

        bird.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
        bird.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length());

        bird.phase = (bird.phase + (Math.max(0, bird.rotation.z) + 0.1)) % 62.83;
        bird.geometry.vertices[5].y = bird.geometry.vertices[4].y = Math.sin(bird.phase) * 5;

    }

    renderer.render(scene, camera);

}