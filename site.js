// Shared: custom cursor, spotlight, technical grid field
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');
const root = document.documentElement;

if (cursor && cursorDot) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
  const dxTo = gsap.quickTo(cursorDot, 'x', { duration: 0.12, ease: 'power3' });
  const dyTo = gsap.quickTo(cursorDot, 'y', { duration: 0.12, ease: 'power3' });
  const mxTo = gsap.quickTo(root, '--mx', { duration: 0.6, ease: 'power2' });
  const myTo = gsap.quickTo(root, '--my', { duration: 0.6, ease: 'power2' });

  window.addEventListener('mousemove', e => {
    xTo(e.clientX);
    yTo(e.clientY);
    dxTo(e.clientX);
    dyTo(e.clientY);
    mxTo(e.clientX + 'px');
    myTo(e.clientY + 'px');
  });

  document.querySelectorAll('a, button, input, .magnetic').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
    );
  });
}

const field = document.querySelector('.field');
if (field) {
  const ctx = field.getContext('2d');
  const CELL = 64;
  let width, height, bars = [];

  function resize() {
    width = field.width = window.innerWidth;
    height = field.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawField() {
    ctx.clearRect(0, 0, width, height);
    const t = Date.now() * 0.001;

    ctx.lineWidth = 1;
    for (let gx = CELL; gx < width; gx += CELL) {
      for (let gy = CELL; gy < height; gy += CELL) {
        const a = 0.04 + 0.12 * (0.5 + Math.sin(t * 1.6 + gx * 0.7 + gy * 1.3) * 0.5);
        ctx.strokeStyle = `rgba(0, 229, 255, ${a})`;
        ctx.beginPath();
        ctx.moveTo(gx - 4, gy); ctx.lineTo(gx + 4, gy);
        ctx.moveTo(gx, gy - 4); ctx.lineTo(gx, gy + 4);
        ctx.stroke();
      }
    }

    if (Math.random() < 0.035) {
      bars.push({
        y: Math.random() * height,
        h: 2 + Math.random() * 16,
        life: 5 + Math.random() * 12,
        max: 17,
        col: Math.random() < 0.5 ? '0,229,255' : '255,42,109'
      });
    }
    bars = bars.filter(b => b.life-- > 0);
    bars.forEach(b => {
      const fade = Math.max(b.life / b.max, 0);
      ctx.fillStyle = `rgba(${b.col},${0.1 * fade})`;
      ctx.fillRect(0, b.y, width, b.h);
      ctx.fillStyle = `rgba(${b.col},${0.25 * fade})`;
      ctx.fillRect(0, b.y + (Math.random() - 0.5) * 6, width * Math.random(), 1);
    });

    requestAnimationFrame(drawField);
  }
  drawField();
}

// Lightweight pageview ping — skipped for admin sessions and admin pages
try {
  if (!localStorage.getItem('ic_admin_token') && !location.pathname.startsWith('/admin')) {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p: location.pathname,
        r: document.referrer ? new URL(document.referrer).host : ''
      }),
      keepalive: true
    }).catch(() => {});
  }
} catch {}
