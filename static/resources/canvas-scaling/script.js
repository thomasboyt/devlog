(function() {
  var width = 80;
  var height = 60;

  var sprite = new Image();

  function withCanvas(cb) {
    var el = document.getElementById('canvas');

    el.width = width;
    el.height = height;

    ctx = el.getContext('2d');

    sprite.onload = function() {
      cb(el, ctx);
      render(ctx);
    };
    sprite.src = 'player.png';
  }

  function render(ctx) {
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.font = '10px Monaco, Consolas, monospace';
    ctx.fillText('hello world', 5, 15)

    ctx.drawImage(sprite, 10, 30);

    ctx.beginPath();
    ctx.arc(55,40,15,0,2*Math.PI);
    ctx.stroke();
  }

  window.withCanvas = withCanvas;
})();
