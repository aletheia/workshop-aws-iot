/**
 * @author Alex Casalboni <alex@cloudacademy.com>
 */

function Field($el) {
    this.$el = $el;
    this.width = 1000;
    this.height = 500;
    this.drones = [];
}

Field.prototype.initDrones = function($elements) {
    var self = this;
    $elements.each(function(i) {
        var $el = $(this);
        setTimeout(function() {
            var drone = new Drone($el, self);
            self.drones.push(drone);
        }, Math.round(Math.random() * 500) * i)
    });
};

Field.prototype.onDroneMove = function(drone) {
    console.log("TODO: override me!");
};

Field.prototype.notifyDrone = function(droneID, message) {
    this.drones.forEach(function(drone) {
        if (droneID == drone.id) {
            drone.onMessage(message);
        }
    });
};

Field.prototype.notifyDrones = function(message) {
    this.drones.forEach(function(drone, i) {
        setTimeout(function() {
            drone.onMessage(message);
        }, 5 * i);
    });
};

Field.prototype.removeDrone = function(drone) {
    var index = this.drones.indexOf(drone);
    console.log("removing drone with index", index, drone);
    this.drones.splice(index, 1);
}

function Drone($el, field) {
    this.id = newUUID();
    this.active = true;
    this.$el = $el;
    this.width = 50;
    this.height = 50;
    this.power = Math.round(Math.random() * 5);
    this.$el.attr('data-power', this.power);
    this.field = field;
    this.timer = 3000;
    this.initSpeed();

    // alarm state on click
    this.$el.click(this.alarm.bind(this));
    this.$el.dblclick(this.destroy.bind(this));

}

Drone.prototype.initSpeed = function() {
    this.$el.removeClass('alarm');
    this.xSpeed = this._randomSpeed();
    this.ySpeed = this._randomSpeed();
    this.animate();
};

Drone.prototype.getX = function() {
    return parseInt(this.$el.css('left'));
};

Drone.prototype.getY = function() {
    return parseInt(this.$el.css('top'));
};


Drone.prototype._randomSpeed = function() {
    return Math.round(Math.random() * 150) - 100;  // -30 to +30
};

Drone.prototype._randomSpeedPositive = function() {
    return Math.round(Math.random() * 40) + 10;  // +10 to +50
};

Drone.prototype._randomSpeedNegative = function() {
    return Math.round(Math.random() * -40) - 10;  // -50 to -10
};

Drone.prototype.animate = function() {
    if (!this.active) {
        return;
    }
    this.$el.animate({
        top: "+=" + this.ySpeed,
        left: "+=" + this.xSpeed
    }, this.timer, "linear", this.checkPosition.bind(this));
};

Drone.prototype.checkPosition = function() {
    var top = parseInt(this.$el.css('top')) + this.height/2,
        left = parseInt(this.$el.css('left')) + this.width/2;

    if (top <= 0 && this.ySpeed <= 0) {
        this.ySpeed = this._randomSpeedPositive();
        // console.log("Too hight, new speed:", this.ySpeed);
    } else if (top >= this.field.height && this.ySpeed >= 0) {
        this.ySpeed = this._randomSpeedNegative();
        // console.log("Too low, new speed:", this.ySpeed);
    }

    if (left <= 0 && this.xSpeed <= 0) {
        this.xSpeed = this._randomSpeedPositive();
        // console.log("Too left, new speed:", this.xSpeed);
    } else if (left >= this.field.width  && this.xSpeed >= 0) {
        this.xSpeed = this._randomSpeedNegative();
        // console.log("Too right, new speed:", this.xSpeed);
    }

    this.field.onDroneMove(this);
    this.animate();

};

Drone.prototype.alarm = function() {
    this.$el.stop(true, false).addClass('alarm');
    this.xSpeed = this.ySpeed = 0;
    setTimeout(this.initSpeed.bind(this), this.timer);
};

Drone.prototype.destroy = function() {
    this.$el.stop().remove();
    this.active = false;
    this.field.removeDrone(this);
};

Drone.prototype.onMessage = function(message) {
    console.log("Drone ", this.id, " received message ", message);
    switch (message.action) {
        case 'alarm':
            return this.alarm();
        case 'destroy':
            return this.destroy();
        case 'power':
            return this.power = message.value;
        default:
            return console.error("Unrecognised msg:", message)
    }
};
