import React, { useRef, useEffect } from 'react';

enum PathMode {
  MODE_1,
  MODE_2,
}

const LINE_DURATION = 2;
const LINE_WIDTH_START = 5;

const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points: Point[] = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const lineDuration = LINE_DURATION;
    const lineWidthStart = LINE_WIDTH_START;
    const spread = 2;
    const mode = 1;
    const pathMode: PathMode = PathMode.MODE_1;
    const drawEveryFrame = 1; // Only adds a Point after these many 'mousemove' events

    let frame = 0;
    let flipNext = true;

    function animatePoints(ctx: CanvasRenderingContext2D) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const duration = lineDuration * 1000 / 60;
      let point, lastPoint;

      if (pathMode === PathMode.MODE_2) {
        ctx.beginPath();
      }

      for (let i = 0; i < points.length; i++) {
        point = points[i];

        if (points[i - 1] !== undefined) {
          lastPoint = points[i - 1];
        } else {
          lastPoint = points[i];
        }

        if (point) {
          point.lifetime += 1;

          if (point.lifetime > duration) {
            points.splice(i, 1);
            continue;
          }

          // Begin drawing stuff!
          const inc = point.lifetime / duration; // 0 to 1 over lineDuration
          const dec = 1 - inc;

          let spreadRate = 0;
          if (spread === 1) {
            spreadRate = lineWidthStart / (point.lifetime * 2);
          } // Lerp Decrease
          if (spread === 2) {
            spreadRate = lineWidthStart * (1 - inc);
          } // Linear Decrease

          const fadeRate = dec;

          ctx.lineJoin = "round";
          ctx.lineWidth = spreadRate;
          ctx.strokeStyle = `rgb(${Math.floor(255)}, ${Math.floor(200 - 255 * dec)}, ${Math.floor(200 - 255 * inc)})`;

          const distance = Point.distance(lastPoint, point);
          const midpoint = Point.midPoint(lastPoint, point);
          const angle = Point.angle(lastPoint, point);

          if (pathMode === PathMode.MODE_1) {
            ctx.beginPath();
          }

          if (mode === 1) {
            ctx.arc(midpoint.x, midpoint.y, distance / 2, angle, angle + Math.PI, point.flip);
          }

          if (mode === 2) {
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(point.x, point.y);
          }

          if (pathMode === PathMode.MODE_1) {
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      if (pathMode === PathMode.MODE_2) {
        ctx.stroke();
        ctx.closePath();
      }
    }

    function addPoint(x: number, y: number) {
      flipNext = !flipNext;
      const point = new Point(x, y, 0, flipNext);
      points.push(point);
    }

    function resizeCanvas(w: number, h: number) {
      if (ctx !== undefined) {
        ctx.canvas.width = w;
        ctx.canvas.height = h;
      }
    }

    // Mouse Listeners
    function enableListeners() {
      document.addEventListener('mousemove', (e) => {
        if (frame === drawEveryFrame) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left; // Adjust the x position based on the canvas position
          const y = e.clientY - rect.top; // Adjust the y position based on the canvas position
          addPoint(x, y);
          frame = 0;
        }
        frame++;
      });
    }

    // RequestAnimFrame definition
    window.requestAnimFrame = (function (callback) {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })();

    enableListeners();
    draw();

    function draw() {
      if (ctx) {
        animatePoints(ctx);
      }
      requestAnimationFrame(draw);
    }

    function enableDrawingCanvas() {
      if (canvas === undefined) {
        const newCanvas = document.createElement('canvas');
        newCanvas.setAttribute('id', 'myCanvas');
        newCanvas.style.position = 'fixed';
        newCanvas.style.top = '0';
        newCanvas.style.left = '0';
        newCanvas.style.pointerEvents = 'none';
        newCanvas.style.zIndex = '9999'; /* Ensure it's above other elements on the page */
        document.body.appendChild(newCanvas);
      }
    }

    enableDrawingCanvas();
    resizeCanvas(window.innerWidth, window.innerHeight);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
};

export default MouseTrail;

// Point Class
class Point {
  x: number;
  y: number;
  lifetime: number;
  flip: boolean;

  constructor(x: number, y: number, lifetime: number, flip: boolean) {
    this.x = x;
    this.y = y;
    this.lifetime = lifetime;
    this.flip = flip;
  }

  static distance(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  static midPoint(a: Point, b: Point) {
    const mx = a.x + (b.x - a.x) * 0.5;
    const my = a.y + (b.y - a.y) * 0.5;

    return new Point(mx, my, 0, false);
  }

  static angle(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.atan2(dy, dx);
  }
}
