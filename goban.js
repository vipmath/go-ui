// Creates a goban of the requested size - each of the size lines are seperated
// by scale pixels.
// (c)2017 All Rights Reserved by Laurent Demailly

var maxSize = 19

function GoBan(size = 19) {
  this.n = size;
  this.game = [];
  this.board = new Array(maxSize)
  for (var i = 0; i < maxSize; i++) {
    this.board[i] = new Array(maxSize)
  }
  this.withCoordinates = true
  this.withSounds = true
  this.withLastMoveHighlight = true

  // Draw 1 hoshi (star point) at x,y
  this.hoshi = function(x, y) {
    var ctx = this.ctx
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.posToCoord(x), this.posToCoord(y), 2.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw all the hoshis
  this.drawHoshis = function() {
    var mid = (this.n - 1) / 2
    this.hoshi(mid, mid)
    var h = 3
    if (this.n < 13) {
      var h = 2
    }
    var g = this.n - h - 1;
    this.hoshi(h, h)
    this.hoshi(g, h)
    this.hoshi(h, g)
    this.hoshi(g, g)
    if (this.n > 13) {
      this.hoshi(h, mid)
      this.hoshi(g, mid)
      this.hoshi(mid, h)
      this.hoshi(mid, g)
    }
  }

  this.posToLetter = function(i) {
    if (i >= 8) {
      i++ // skip I
    }
    return String.fromCharCode(65 + i)
  }

  this.drawCoordinates = function() {
    this.ctx.font = "bold " + this.sz1 * .38 + "px Arial"
    this.ctx.fillStyle = "DimGray"
    for (var i = 0; i < this.n; i++) {
      var num = "" + (this.n - i)
      this.ctx.fillText(num, this.posToCoord(-1.52), this.posToCoord(i + .1))
      this.ctx.fillText(num, this.posToCoord(this.n + .1), this.posToCoord(i + .15))
      var letter = this.posToLetter(i)
      this.ctx.fillText(letter, this.posToCoord(i - 0.1), this.posToCoord(this.n + 0.35))
      this.ctx.fillText(letter, this.posToCoord(i - 0.1), this.sz1 / 3)
    }
  }

  this.AddHighlight = function() {
    var l = this.game.length
    if ((!this.withLastMoveHighlight) || (l == 0)) {
      return
    }
    var lastMove = this.game[l - 1]
    if (this.OutOfBounds(lastMove.x, lastMove.y)) {
      return
    }
    var highlight = this.HighlightColor(lastMove.color)
    var ctx = this.ctx
    ctx.beginPath();
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 2;
    var rs = this.stoneRadius * .55
    var x = this.posToCoord(lastMove.x)
    var y = this.posToCoord(lastMove.y)
    ctx.moveTo(x - rs, y - rs)
    ctx.lineTo(x + rs, y + rs)
    ctx.moveTo(x + rs, y - rs)
    ctx.lineTo(x - rs, y + rs)
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = lastMove.color;
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill()
  }

  this.RemoveHighlight = function() {
    var l = this.game.length;
    if ((!this.withLastMoveHighlight) || (l == 0)) {
      return
    }
    var lastMove = this.game[l - 1]
    this.drawStone(lastMove.x, lastMove.y, lastMove.color)
  }

  this.RecordMove = function(x, y, color) {
    this.RemoveHighlight();
    this.game.push({
      x,
      y,
      color
    });
    this.board[x][y] = color;
    this.drawStone(x, y, color, this.withLastMoveHighlight);
    this.AddHighlight();
  }

  this.HighlightColor = function(color) {
    if (color == "white") {
      return "black"
    } else {
      return "white"
    }
  }

  this.drawStone = function(x, y, color, skipHighlight = false) {
    if (this.OutOfBounds(x, y)) {
      console.log("Skipping OOB " + x + " " + y)
      return
    }
    var highlight = this.HighlightColor(color)
    var ctx = this.ctx
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(this.posToCoord(x), this.posToCoord(y), this.stoneRadius, 0, 2 * Math.PI);
    ctx.fill();
    if (!skipHighlight) {
      ctx.beginPath();
      ctx.strokeStyle = highlight;
      ctx.arc(this.posToCoord(x), this.posToCoord(y), this.stoneRadius * 2 / 3, 0.15, Math.PI / 2 - .15);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.strokeStyle = "grey"
    ctx.arc(this.posToCoord(x), this.posToCoord(y), this.stoneRadius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // internal utility for coord -> pixels translation
  this.posToCoord = function(x) {
    // need 0.5 to look sharp/black instead of grey
    return 0.5 + this.delta + x * this.sz1;
  }
  // inverse of above
  this.coordToPos = function(x) {
    return Math.round((x - 0.5 - this.delta) / this.sz1);
  }

  // Draw the main board on the given canvas
  this.Draw = function(c, scale = 24) {
    this.sz1 = scale;
    this.stoneRadius = scale / 2 - .5;
    this.gobanSz = (this.n + 1) * scale
    this.delta = scale * 1.5;
    if (!this.canvas) {
      // First time, setup listener
      var self = this
      c.addEventListener("mousedown", function(event) {
        self.clickPosition(event);
      });
      this.canvas = c;
    }
    this.Redraw()
  }

  this.OutOfBounds = function(i, j) {
    return (i < 0 || j < 0 || i >= this.n || j >= this.n)
  }

  this.isValid = function(i, j) {
    if (this.OutOfBounds(i, j)) {
      return false
    }
    return !this.board[i][j]
  }

  this.clickPosition = function(event) {
    var x = event.offsetX
    var y = event.offsetY
    var i = this.coordToPos(x)
    var j = this.coordToPos(y)
    if (this.isValid(i, j)) {
      console.log("Valid move " + i + " , " + j)
      if (this.withSounds) {
        audio.play();
      }
      this.RecordMove(i, j, (this.game.length % 2 == 0) ? "black" : "white")
    } else {
      console.log("Invalid move " + i + " , " + j)
    }
  }

  this.Redraw = function() {
    c = this.canvas
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    c.height = this.gobanSz + this.sz1;
    c.width = this.gobanSz + this.sz1;
    this.ctx = ctx;
    ctx.fillStyle = "moccasin";
    ctx.fillRect(this.sz1 / 2, this.sz1 / 2, this.gobanSz, this.gobanSz);
    ctx.fillStyle = "black";
    var zero = this.posToCoord(0)
    var last = this.posToCoord(this.n - 1)
    for (var i = 0; i < this.n; i++) {
      var x = this.posToCoord(i)
      ctx.moveTo(x, zero)
      ctx.lineTo(x, last)
      ctx.moveTo(zero, x)
      ctx.lineTo(last, x)
    }
    ctx.stroke()
    this.drawHoshis()
    if (this.withCoordinates) {
      this.drawCoordinates()
    }
    var len = this.game.length - 1
    for (var i = 0; i <= len; i++) {
      var skipHighlight = (i == len && this.withLastMoveHighlight) // for the last move
      this.drawStone(this.game[i].x, this.game[i].y, this.game[i].color, skipHighlight)
    }
    this.AddHighlight();
  }

  this.Undo = function() {
    var l = this.game.length
    if (l == 0) {
      return
    }
    l--
    var pos = this.game[l]
    this.game.length = l // truncate
    delete this.board[pos.x][pos.y]
    this.Redraw()
  }

}

// Stone sound (c)2017 All Rights Reserved by Laurent Demailly
var audio = new Audio('gostone.m4a');
