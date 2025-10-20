// --- 圓的設定 ---
let circles = [];
let explosions = []; // 新增：爆破陣列
const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const NUM_CIRCLES = 20;

const PARTICLES_PER_EXPLOSION = 30;
const PARTICLE_SPEED = 2.5;

let explosionSound; // 新增：爆破音效變數
let audioUnlocked = false;
let score = 0; // 分數

function preload() {
  // 請把音效檔放在專案的 assets/pop.mp3 (或 pop.wav)，名稱需與此一致
  soundFormats('mp3', 'wav');
  explosionSound = loadSound('assets/pop.mp3',
    () => { console.log('爆破音效已載入'); try { explosionSound.playMode && explosionSound.playMode('sustain'); } catch(e){} },
    (err) => { console.error('載入爆破音效失敗', err); }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 初始化圓（每個圓儲存 hex 字串在 c.hex）
  circles = [];
  for (let i = 0; i < NUM_CIRCLES; i++) {
    let hex = random(COLORS);
    circles.push({
      x: random(width),
      y: random(height),
      r: random(50, 200), // 直徑
      hex: hex,
      color: color(hex),
      alpha: random(80, 255),
      speed: random(1, 5)
    });
  }
  textFont('Arial');
  textAlign(CENTER, CENTER);
}

function draw() {
  background('#fcf6bd');
  noStroke();

  // 畫並更新氣球
  for (let c of circles) {
    c.y -= c.speed;

    if (c.y + c.r / 2 < 0) { // 超出頂端則從底部出現
      resetCircle(c);
    }

    c.color.setAlpha(c.alpha);
    fill(c.color);
    circle(c.x, c.y, c.r);

    // 右上 1/4 的小方塊
    let squareSize = c.r / 6;
    let angle = -PI / 4;
    let distance = c.r / 2 * 0.65;
    let squareCenterX = c.x + cos(angle) * distance;
    let squareCenterY = c.y + sin(angle) * distance;
    fill(255, 255, 255, 120);
    noStroke();
    rectMode(CENTER);
    rect(squareCenterX, squareCenterY, squareSize, squareSize);
  }

  // 更新並畫出爆炸粒子
  for (let i = explosions.length - 1; i >= 0; i--) {
    let ex = explosions[i];
    for (let p of ex.particles) {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.fade;
      p.size *= p.shrink;
      fill(p.rCol, p.gCol, p.bCol, max(0, p.alpha));
      noStroke();
      circle(p.x, p.y, max(0.5, p.size));
    }
    if (ex.particles.every(p => p.alpha <= 0 || p.size <= 0.5)) {
      explosions.splice(i, 1);
    }
  }

  // 顯示學號（左上）與分數（右上）
  textSize(32);
  fill('#669bbc');
  textAlign(LEFT, TOP);
  text('414730324', 10, 10);

  textAlign(RIGHT, TOP);
  text('得分: ' + score, width - 10, 10);

  // 若尚未解鎖音訊，顯示提示文字（下方）
  if (!audioUnlocked) {
    fill(0, 160);
    rectMode(CENTER);
    rect(width / 2, height - 60, 420, 56, 12);
    fill(255);
    noStroke();
    textSize(18);
    textAlign(CENTER, CENTER);
    text('點擊畫面以啟用音效（Click to enable sound）', width / 2, height - 60);
  }
}

function createExplosion(c) {
  // 嘗試播放爆破音效（在 user gesture 下通常可播放）
  if (explosionSound && explosionSound.isLoaded()) {
    try {
      let vol = random(0.6, 1.0);
      let rate = random(0.95, 1.05);
      explosionSound.play(0, rate, vol);
    } catch (e) {
      console.warn('播放爆破音效失敗', e);
    }
  }

  // 建立粒子
  let rCol = red(c.color);
  let gCol = green(c.color);
  let bCol = blue(c.color);
  let ex = { particles: [] };
  for (let i = 0; i < PARTICLES_PER_EXPLOSION; i++) {
    let angle = random(TWO_PI);
    let speed = random(0.5, PARTICLE_SPEED) * (0.4 + random());
    let vx = cos(angle) * speed;
    let vy = sin(angle) * speed;
    ex.particles.push({
      x: c.x + random(-c.r/6, c.r/6),
      y: c.y + random(-c.r/6, c.r/6),
      vx: vx,
      vy: vy,
      gravity: 0.03 * random(0.5, 1.5),
      rCol: rCol + random(-20, 20),
      gCol: gCol + random(-20, 20),
      bCol: bCol + random(-20, 20),
      alpha: random(180, 255),
      fade: random(2, 6),
      size: random(4, max(6, c.r / 12)),
      shrink: random(0.985, 0.995)
    });
  }
  explosions.push(ex);
}

function resetCircle(c) {
  c.y = height + c.r / 2;
  c.x = random(width);
  c.r = random(50, 200);
  c.hex = random(COLORS);
  c.color = color(c.hex);
  c.alpha = random(80, 255);
  c.speed = random(1, 5);
}

function mousePressed() {
  // 嘗試解鎖音訊（某些瀏覽器需使用者互動）
  if (typeof userStartAudio === 'function') {
    userStartAudio().then(() => {
      audioUnlocked = true;
      console.log('音訊已解鎖 (userStartAudio)');
    }).catch((e) => {
      console.warn('userStartAudio 失敗', e);
    });
  } else {
    audioUnlocked = true;
  }

  // 檢查是否點到某個氣球（由上到下檢查，點到第一個就處理）
  for (let i = circles.length - 1; i >= 0; i--) {
    let c = circles[i];
    let d = dist(mouseX, mouseY, c.x, c.y);
    if (d <= c.r / 2) {
      // 計分：按到 #ffca3a 加一分，其他顏色扣一分
      if (c.hex && c.hex.toLowerCase() === '#ffca3a') score += 1;
      else score -= 1;

      // 產生爆炸效果並重置該氣球
      createExplosion(c);
      resetCircle(c);
      break; // 處理完一個氣球後離開
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (let c of circles) {
    c.x = random(width);
    c.y = random(height);
  }
}