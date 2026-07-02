/**
 * demo.js — Lớp Asset cho màn Demo Đơn Giản (Task 3)
 * Vanilla JS, IIFE, không framework.
 * Dữ liệu furniture được bake từ manifest.json đọc lúc build — KHÔNG fetch .json lúc runtime.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Hằng số tile / sprite nhân vật
  // ---------------------------------------------------------------------------
  const TILE = 16;       // kích thước tile cơ bản (px)
  const CHAR_FW = 16;    // chiều rộng 1 frame nhân vật
  const CHAR_FH = 32;    // chiều cao 1 frame nhân vật

  // Hàng trong sprite sheet → hướng nhân vật
  const CHAR_ROW = {
    down:  0,
    up:    1,
    right: 2
    // left: vẽ row right rồi lật ngang (ctx.scale(-1,1))
  };

  // Cột trong sprite sheet → trạng thái + animation frame
  const CHAR_FRAMES = {
    walk:    [0, 1, 2],   // 3 frame đi bộ
    typing:  [3, 4],      // 2 frame gõ phím
    reading: [5, 6]       // 2 frame đọc
  };

  function byId(id) {
    return document.getElementById(id);
  }

  // ---------------------------------------------------------------------------
  // Danh sách đường dẫn asset
  // ---------------------------------------------------------------------------

  // 6 sprite sheet nhân vật (char_0 … char_5)
  const CHARACTER_SHEETS = [
    '/demo/assets/characters/char_0.png',
    '/demo/assets/characters/char_1.png',
    '/demo/assets/characters/char_2.png',
    '/demo/assets/characters/char_3.png',
    '/demo/assets/characters/char_4.png',
    '/demo/assets/characters/char_5.png'
  ];

  // 9 tile sàn (floor_0 … floor_8)
  const FLOOR_TILES = [
    '/demo/assets/floors/floor_0.png',
    '/demo/assets/floors/floor_1.png',
    '/demo/assets/floors/floor_2.png',
    '/demo/assets/floors/floor_3.png',
    '/demo/assets/floors/floor_4.png',
    '/demo/assets/floors/floor_5.png',
    '/demo/assets/floors/floor_6.png',
    '/demo/assets/floors/floor_7.png',
    '/demo/assets/floors/floor_8.png'
  ];

  // Sheet tường (16×32 per cell) — chỉ preload ở Task 3
  const WALL_SHEET = '/demo/assets/walls/wall_0.png';

  // ---------------------------------------------------------------------------
  // FURNITURE metadata — baked từ manifest.json (đọc lúc viết code, không fetch lúc runtime)
  // Mỗi nhóm: { id, members: [...] }
  // Với type=asset (single), members chứa 1 phần tử duy nhất.
  // ---------------------------------------------------------------------------
  const FURNITURE = {

    DESK: {
      id: 'DESK',
      members: [
        {
          id: 'DESK_FRONT',
          file: '/demo/assets/furniture/DESK/DESK_FRONT.png',
          width: 48, height: 32,
          footprintW: 3, footprintH: 2,
          orientation: 'front'
        },
        {
          id: 'DESK_SIDE',
          file: '/demo/assets/furniture/DESK/DESK_SIDE.png',
          width: 16, height: 64,
          footprintW: 1, footprintH: 4,
          orientation: 'side'
        }
      ]
    },

    WOODEN_CHAIR: {
      id: 'WOODEN_CHAIR',
      members: [
        {
          id: 'WOODEN_CHAIR_FRONT',
          file: '/demo/assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_FRONT.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'front'
        },
        {
          id: 'WOODEN_CHAIR_BACK',
          file: '/demo/assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_BACK.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'back'
        },
        {
          id: 'WOODEN_CHAIR_SIDE',
          file: '/demo/assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_SIDE.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'side',
          mirrorSide: true
        }
      ]
    },

    CUSHIONED_CHAIR: {
      id: 'CUSHIONED_CHAIR',
      members: [
        {
          id: 'CUSHIONED_CHAIR_FRONT',
          file: '/demo/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT.png',
          width: 16, height: 16,
          footprintW: 1, footprintH: 1,
          orientation: 'front'
        },
        {
          id: 'CUSHIONED_CHAIR_BACK',
          file: '/demo/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK.png',
          width: 16, height: 16,
          footprintW: 1, footprintH: 1,
          orientation: 'back'
        },
        {
          id: 'CUSHIONED_CHAIR_SIDE',
          file: '/demo/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_SIDE.png',
          width: 16, height: 16,
          footprintW: 1, footprintH: 1,
          orientation: 'side',
          mirrorSide: true
        }
      ]
    },

    PC: {
      id: 'PC',
      members: [
        // Hướng front — trạng thái on (3 frame animation)
        {
          id: 'PC_FRONT_ON_1',
          file: '/demo/assets/furniture/PC/PC_FRONT_ON_1.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'front', state: 'on', frame: 0
        },
        {
          id: 'PC_FRONT_ON_2',
          file: '/demo/assets/furniture/PC/PC_FRONT_ON_2.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'front', state: 'on', frame: 1
        },
        {
          id: 'PC_FRONT_ON_3',
          file: '/demo/assets/furniture/PC/PC_FRONT_ON_3.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'front', state: 'on', frame: 2
        },
        // Hướng front — trạng thái off
        {
          id: 'PC_FRONT_OFF',
          file: '/demo/assets/furniture/PC/PC_FRONT_OFF.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'front', state: 'off'
        },
        // Hướng back
        {
          id: 'PC_BACK',
          file: '/demo/assets/furniture/PC/PC_BACK.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'back'
        },
        // Hướng side (mirror để lấy left)
        {
          id: 'PC_SIDE',
          file: '/demo/assets/furniture/PC/PC_SIDE.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'side',
          mirrorSide: true
        }
      ]
    },

    WHITEBOARD: {
      id: 'WHITEBOARD',
      members: [
        {
          id: 'WHITEBOARD',
          file: '/demo/assets/furniture/WHITEBOARD/WHITEBOARD.png',
          width: 32, height: 32,
          footprintW: 2, footprintH: 2
        }
      ]
    },

    PLANT: {
      id: 'PLANT',
      members: [
        {
          id: 'PLANT',
          file: '/demo/assets/furniture/PLANT/PLANT.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2
        }
      ]
    },

    LARGE_PLANT: {
      id: 'LARGE_PLANT',
      members: [
        {
          id: 'LARGE_PLANT',
          file: '/demo/assets/furniture/LARGE_PLANT/LARGE_PLANT.png',
          width: 32, height: 48,
          footprintW: 2, footprintH: 3
        }
      ]
    },

    SOFA: {
      id: 'SOFA',
      members: [
        {
          id: 'SOFA_FRONT',
          file: '/demo/assets/furniture/SOFA/SOFA_FRONT.png',
          width: 32, height: 16,
          footprintW: 2, footprintH: 1,
          orientation: 'front'
        },
        {
          id: 'SOFA_BACK',
          file: '/demo/assets/furniture/SOFA/SOFA_BACK.png',
          width: 32, height: 16,
          footprintW: 2, footprintH: 1,
          orientation: 'back'
        },
        {
          id: 'SOFA_SIDE',
          file: '/demo/assets/furniture/SOFA/SOFA_SIDE.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2,
          orientation: 'side',
          mirrorSide: true
        }
      ]
    },

    COFFEE: {
      id: 'COFFEE',
      members: [
        {
          id: 'COFFEE',
          file: '/demo/assets/furniture/COFFEE/COFFEE.png',
          width: 16, height: 16,
          footprintW: 1, footprintH: 1
        }
      ]
    },

    BOOKSHELF: {
      id: 'BOOKSHELF',
      members: [
        {
          id: 'BOOKSHELF',
          file: '/demo/assets/furniture/BOOKSHELF/BOOKSHELF.png',
          width: 32, height: 16,
          footprintW: 2, footprintH: 1
        }
      ]
    },

    CLOCK: {
      id: 'CLOCK',
      members: [
        {
          id: 'CLOCK',
          file: '/demo/assets/furniture/CLOCK/CLOCK.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2
        }
      ]
    },

    BIN: {
      id: 'BIN',
      members: [
        {
          id: 'BIN',
          file: '/demo/assets/furniture/BIN/BIN.png',
          width: 16, height: 16,
          footprintW: 1, footprintH: 1
        }
      ]
    },

    SMALL_PAINTING: {
      id: 'SMALL_PAINTING',
      members: [
        {
          id: 'SMALL_PAINTING',
          file: '/demo/assets/furniture/SMALL_PAINTING/SMALL_PAINTING.png',
          width: 16, height: 32,
          footprintW: 1, footprintH: 2
        }
      ]
    },

    LARGE_PAINTING: {
      id: 'LARGE_PAINTING',
      members: [
        {
          id: 'LARGE_PAINTING',
          file: '/demo/assets/furniture/LARGE_PAINTING/LARGE_PAINTING.png',
          width: 32, height: 32,
          footprintW: 2, footprintH: 2
        }
      ]
    },

    COFFEE_TABLE: {
      id: 'COFFEE_TABLE',
      members: [
        {
          id: 'COFFEE_TABLE',
          file: '/demo/assets/furniture/COFFEE_TABLE/COFFEE_TABLE.png',
          width: 32, height: 32,
          footprintW: 2, footprintH: 2
        }
      ]
    }

  }; // end FURNITURE

  // ---------------------------------------------------------------------------
  // Module Assets — nạp và truy xuất HTMLImageElement
  // ---------------------------------------------------------------------------
  const Assets = (function () {
    // Kho lưu ảnh đã nạp: key → HTMLImageElement
    const _store = Object.create(null);

    /**
     * Nạp nhiều ảnh song song.
     * @param {Object} map  { key: urlString, ... }
     * @returns {Promise<void>}  resolve khi tất cả xong; reject kèm thông tin file lỗi.
     */
    function load(map) {
      const entries = Object.entries(map);
      const promises = entries.map(function (_ref) {
        const key = _ref[0];
        const url = _ref[1];
        return new Promise(function (resolve, reject) {
          // Nếu đã nạp rồi thì bỏ qua
          if (_store[key]) { resolve(); return; }
          const img = new Image();
          img.onload = function () {
            _store[key] = img;
            resolve();
          };
          img.onerror = function () {
            reject(new Error('Assets.load: không nạp được ảnh "' + key + '" tại ' + url));
          };
          img.src = url;
        });
      });
      return Promise.all(promises);
    }

    /**
     * Lấy HTMLImageElement đã nạp theo key.
     * @param {string} key
     * @returns {HTMLImageElement|undefined}
     */
    function get(key) {
      return _store[key];
    }

    return { load: load, get: get };
  })();

  // ---------------------------------------------------------------------------
  // Lưới phòng — khớp canvas 640×352 ở 16px/ô
  // ---------------------------------------------------------------------------
  const COLS = 48;  // 768 / 16
  const ROWS = 30;  // 480 / 16 — mở rộng để có phòng rộng + tường dày + hành lang đầy đủ

  // Kích thước "logic" của sân khấu (đơn vị toạ độ dùng khắp nơi).
  const STAGE_W = COLS * TILE;  // 640
  const STAGE_H = ROWS * TILE;  // 448
  // Hệ số supersampling: backing store = logic × scale → chữ + sprite sắc nét khi phóng to.
  const RENDER_SCALE = 2;

  // Helper: lấy member theo group + id từ FURNITURE
  function furnMember(group, id) {
    const g = FURNITURE[group];
    if (!g || !g.members) { return null; }
    return g.members.find(function (m) { return m.id === id; }) || null;
  }

  function inBounds(x, y) {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS;
  }

  function clonePoint(p) {
    return { x: p.x, y: p.y };
  }

  function gridKey(x, y) {
    return x + ',' + y;
  }

  function choose(list) {
    if (!list || !list.length) { return null; }
    return list[Math.floor(Math.random() * list.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function bfsPath(start, goal) {
    if (!inBounds(start.x, start.y) || !inBounds(goal.x, goal.y)) { return null; }
    if (Room.blocked[start.y][start.x] || Room.blocked[goal.y][goal.x]) { return null; }
    if (start.x === goal.x && start.y === goal.y) { return [clonePoint(start)]; }

    const queue = [clonePoint(start)];
    const prev = Object.create(null);
    const seen = Object.create(null);
    seen[gridKey(start.x, start.y)] = true;
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 }
    ];

    while (queue.length) {
      const cur = queue.shift();
      for (let i = 0; i < dirs.length; i++) {
        const nx = cur.x + dirs[i].x;
        const ny = cur.y + dirs[i].y;
        const key = gridKey(nx, ny);
        if (!inBounds(nx, ny) || seen[key] || Room.blocked[ny][nx]) { continue; }
        seen[key] = true;
        prev[key] = cur;
        if (nx === goal.x && ny === goal.y) {
          const path = [{ x: nx, y: ny }];
          let walk = cur;
          while (walk) {
            path.push({ x: walk.x, y: walk.y });
            walk = prev[gridKey(walk.x, walk.y)] || null;
          }
          path.reverse();
          return path;
        }
        queue.push({ x: nx, y: ny });
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Module Room — bố trí + vẽ phòng (sàn, tường, nội thất). Chưa có nhân vật.
  // ---------------------------------------------------------------------------
  const Room = (function () {

    // Ma trận ô không đi được [ROWS][COLS]; true = blocked.
    const blocked = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) { row.push(false); }
      blocked.push(row);
    }

    function markBlocked(x, y, w, h) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          if (yy >= 0 && yy < ROWS && xx >= 0 && xx < COLS) {
            blocked[yy][xx] = true;
          }
        }
      }
    }

    function markWallSegment(x, y, w, h, doors) {
      const open = Object.create(null);
      (doors || []).forEach(function (door) {
        open[door.x + ',' + door.y] = true;
      });
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          if (!open[xx + ',' + yy]) { markBlocked(xx, yy, 1, 1); }
        }
      }
    }

    // Bố cục mở rộng (sáng ấm): phòng họp Persona reception ở TRÊN, hành lang dọc
    // nối xuống HÀNH LANG XƯƠNG SỐNG ngang, mở vào 3 phòng có vách dày:
    // Mission Control (trái) + Agent workspace (giữa) + Pantry lounge (phải).
    const ROOMS = {
      reception: { x: 16, y: 1,  w: 16, h: 10, label: 'Phòng họp tiếp khách', labelY: 1 },
      mission:   { x: 3,  y: 16, w: 11, h: 12, label: 'Control Room', labelY: 27 },
      workspace: { x: 16, y: 16, w: 16, h: 12, label: 'Workspace Room', labelX: 25, labelY: 16 },
      pantry:    { x: 34, y: 16, w: 11, h: 12, label: 'Pantry', labelY: 27 }
    };

    // Vùng sàn đi được (mask). Ô ngoài mask = tường/void.
    const FLOOR_RECTS = [
      { x: 16, y: 3,  w: 16, h: 7 },   // sàn phòng họp (mở rộng: cols16..31, rows3..9)
      { x: 23, y: 9,  w: 2,  h: 6 },   // hành lang dọc nối xuống (rows 9..14)
      { x: 3,  y: 13, w: 42, h: 2 },   // hành lang xương sống ngang (rows 13..14)
      { x: 45, y: 13, w: 3,  h: 2 },   // CỬA RA VÀO chính + sảnh ngoài (cols45..47) cho persona đi vào/ra
      { x: 3,  y: 16, w: 11, h: 12 },  // sàn Mission Control
      { x: 16, y: 16, w: 16, h: 12 },  // sàn workspace
      { x: 34, y: 16, w: 11, h: 12 },  // sàn pantry + lounge
      // Cửa nối hành lang xương sống vào 3 phòng (mở 1 ô ở hàng tường row 15)
      { x: 8,  y: 15, w: 1, h: 1 },    // cửa Mission Control
      { x: 23, y: 15, w: 2, h: 1 },    // cửa workspace (thẳng hành lang dọc)
      { x: 39, y: 15, w: 1, h: 1 },    // cửa pantry
      { x: 14, y: 20, w: 2, h: 1 }     // cửa tắt Mission Control <-> workspace cho handoff brief
    ];
    // Trong Pantry lounge: hàng < SPLIT là khu bếp (kem), >= SPLIT là lounge (xanh nhạt).
    const PANTRY_LOUNGE_SPLIT = 20;
    // Procedural pantry fixtures are drawn without sprites, so they need matching path blocks.
    const PANTRY_FIXTURE_BLOCKS = [
      { x: 35, y: 16, w: 1, h: 2 },
      { x: 38, y: 16, w: 1, h: 2 },
      { x: 41, y: 17, w: 4, h: 1 }
    ];
    // Ô cửa (để vẽ ngưỡng/khung cửa cho dễ thấy).
    const DOORS = [
      { x: 23, y: 9 }, { x: 24, y: 9 },   // reception mở xuống hành lang dọc
      { x: 8,  y: 15 },                    // cửa Mission Control
      { x: 23, y: 15 }, { x: 24, y: 15 },  // cửa workspace
      { x: 14, y: 20 }, { x: 15, y: 20 },  // cửa tắt Mission Control <-> workspace
      { x: 39, y: 15 },                    // cửa pantry
      { x: 45, y: 13 }, { x: 45, y: 14 }   // CỬA RA VÀO chính (cuối hành lang phải)
    ];
    // Ô cửa ra vào chính (để vẽ khung + sảnh) và các ô sảnh ngoài cho persona spawn.
    const ENTRANCE = { doorX: 45, y0: 13, y1: 14, landingX: 46, landingW: 2 };

    const floorMask = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) { row.push(false); }
      floorMask.push(row);
    }

    // 6 bàn làm việc: Henzy ở Mission Control; 5 agent còn lại ở workspace (2 hàng).
    const DESKS = [
      { key: 'mission_control',  deskTile: { x: 7,  y: 18 }, seat: { x: 8,  y: 20 }, facing: 'up' },
      { key: 'launch_readiness', deskTile: { x: 17, y: 18 }, seat: { x: 18, y: 20 }, facing: 'up' },
      { key: 'red_team',         deskTile: { x: 22, y: 18 }, seat: { x: 23, y: 20 }, facing: 'up' },
      { key: 'checklist',        deskTile: { x: 27, y: 18 }, seat: { x: 28, y: 20 }, facing: 'up' },
      { key: 'postmortem',       deskTile: { x: 25, y: 24 }, seat: { x: 26, y: 26 }, facing: 'up' },
      { key: 'assistant',        deskTile: { x: 18, y: 24 }, seat: { x: 19, y: 26 }, facing: 'up' }
    ];

    // Phòng họp tiếp khách: Nick chủ trì đầu bàn, hội đồng 10 persona ngồi 5-5 hai bên bàn dài.
    const MEETING = {
      x: 16, y: 1, w: 16, h: 10,
      // Bàn họp dài (4 coffee table ghép) ở giữa, rows 5-6.
      tableTiles: [ { x: 20, y: 5 }, { x: 22, y: 5 }, { x: 24, y: 5 }, { x: 26, y: 5 } ],
      // Nick ngồi ĐẦU BÀN bên trái, nhìn sang PHẢI (chủ trì hội nghị).
      redSeat: { x: 18, y: 5 },
      // 10 ghế persona: seats[0..4] hàng DƯỚI nhìn lên, seats[5..9] hàng TRÊN nhìn xuống.
      seats: [
        { x: 19, y: 7 },
        { x: 21, y: 7 },
        { x: 23, y: 7 },
        { x: 25, y: 7 },
        { x: 27, y: 7 },
        { x: 19, y: 4 },
        { x: 21, y: 4 },
        { x: 23, y: 4 },
        { x: 25, y: 4 },
        { x: 27, y: 4 }
      ]
    };

    const DECOR = [
      // Phòng họp — 11 ghế hội nghị (noBlock): Nick đầu bàn trái (18,5) nhìn phải,
      // 5 ghế hàng TRÊN (row4) quay xuống + 5 ghế hàng DƯỚI (row7) quay lên.
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_SIDE',  x: 18, y: 5, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 19, y: 4, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 21, y: 4, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 23, y: 4, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 25, y: 4, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 27, y: 4, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_BACK',  x: 19, y: 7, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_BACK',  x: 21, y: 7, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_BACK',  x: 23, y: 7, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_BACK',  x: 25, y: 7, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_BACK',  x: 27, y: 7, noBlock: true },
      { group: 'PLANT',           id: 'PLANT',           x: 16, y: 8, noBlock: true },
      { group: 'PLANT',           id: 'PLANT',           x: 31, y: 8, noBlock: true },
      // Control Room (Henzy) — cây góc, thùng rác; decor treo tường vẽ procedural để không lơ lửng.
      { group: 'LARGE_PLANT',    id: 'LARGE_PLANT',    x: 12, y: 25 },
      { group: 'BIN',            id: 'BIN',            x: 3,  y: 26 },
      // Workspace — dashboard/kệ/đồng hồ vẽ procedural sát tường.
      { group: 'LARGE_PLANT',    id: 'LARGE_PLANT',    x: 30, y: 25 },
      { group: 'PLANT',          id: 'PLANT',          x: 16, y: 26 },
      // Pantry lounge — 2 bàn + 6 ghế/sofa bao quanh.
      // Ghế trên quay XUỐNG nhìn vào bàn (FRONT), ghế cạnh quay vào bàn, sofa dài 2 ô ở dưới quay LÊN.
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 38, y: 22, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_FRONT', x: 40, y: 22, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_SIDE',  x: 37, y: 23, noBlock: true },
      { group: 'CUSHIONED_CHAIR', id: 'CUSHIONED_CHAIR_SIDE',  x: 42, y: 23, noBlock: true, flipX: true },
      { group: 'SOFA',            id: 'SOFA_BACK',             x: 39, y: 25, noBlock: true },
      { group: 'COFFEE_TABLE',   id: 'COFFEE_TABLE',   x: 38, y: 23, noBlock: true },
      { group: 'COFFEE_TABLE',   id: 'COFFEE_TABLE',   x: 40, y: 23, noBlock: true },
      { group: 'LARGE_PLANT',    id: 'LARGE_PLANT',    x: 43, y: 25 },
      { group: 'PLANT',          id: 'PLANT',          x: 35, y: 26, noBlock: true },
      { group: 'BIN',            id: 'BIN',            x: 34, y: 20, noBlock: true }
    ];

    let reviewFocus = false;
    let stagePulse = 0;

    const ACTIVITY_POINTS = {
      desks: {
        mission_control: [
          { x: 8,  y: 20, facing: 'up', state: 'type', holdMin: 1800, holdMax: 3200 },
          { x: 5,  y: 20, facing: 'right', state: 'read', holdMin: 1400, holdMax: 2400 }
        ],
        launch_readiness: [
          { x: 18, y: 20, facing: 'up', state: 'type', holdMin: 1800, holdMax: 3200 },
          { x: 20, y: 20, facing: 'left', state: 'read', holdMin: 1600, holdMax: 2600 }
        ],
        red_team: [
          { x: 23, y: 20, facing: 'up', state: 'read', holdMin: 1600, holdMax: 2600 },
          { x: 21, y: 21, facing: 'right', state: 'idle', holdMin: 1200, holdMax: 2200 }
        ],
        checklist: [
          { x: 28, y: 20, facing: 'up', state: 'type', holdMin: 1800, holdMax: 3200 },
          { x: 30, y: 20, facing: 'left', state: 'read', holdMin: 1400, holdMax: 2400 }
        ],
        postmortem: [
          { x: 26, y: 26, facing: 'up', state: 'read', holdMin: 1800, holdMax: 3000 },
          { x: 28, y: 26, facing: 'left', state: 'idle', holdMin: 1400, holdMax: 2200 }
        ],
        assistant: [
          { x: 19, y: 26, facing: 'up', state: 'type', holdMin: 1800, holdMax: 3000 },
          { x: 17, y: 26, facing: 'right', state: 'idle', holdMin: 1200, holdMax: 2200 }
        ]
      },
      lounge: [
        { x: 37, y: 23, facing: 'down', state: 'idle', holdMin: 1600, holdMax: 2600 },
        { x: 41, y: 24, facing: 'left', state: 'read', holdMin: 1800, holdMax: 2800 },
        { x: 42, y: 26, facing: 'right', state: 'idle', holdMin: 1200, holdMax: 2200 }
      ],
      cafe: [
        { x: 41, y: 19, facing: 'up', state: 'idle', holdMin: 1200, holdMax: 2000 },
        { x: 42, y: 19, facing: 'up', state: 'idle', holdMin: 1400, holdMax: 2200 },
        { x: 43, y: 19, facing: 'up', state: 'read', holdMin: 1600, holdMax: 2600 }
      ],
      whiteboard: [
        { x: 16, y: 18, facing: 'up', state: 'read', holdMin: 1800, holdMax: 2800 },
        { x: 17, y: 17, facing: 'up', state: 'idle', holdMin: 1200, holdMax: 2200 }
      ],
      huddle: [
        { x: 20, y: 22, facing: 'right', state: 'idle', holdMin: 2600, holdMax: 4300 },
        { x: 21, y: 22, facing: 'left', state: 'idle', holdMin: 2600, holdMax: 4300 },
        { x: 22, y: 22, facing: 'left', state: 'read', holdMin: 2400, holdMax: 3900 },
        { x: 23, y: 22, facing: 'left', state: 'idle', holdMin: 2400, holdMax: 3900 }
      ],
      review: [
        { x: 19, y: 5, facing: 'right', state: 'read', holdMin: 2000, holdMax: 3200 },
        { x: 28, y: 5, facing: 'left', state: 'read', holdMin: 1600, holdMax: 2600 },
        { x: 19, y: 7, facing: 'right', state: 'idle', holdMin: 1800, holdMax: 2800 },
        { x: 28, y: 7, facing: 'left', state: 'idle', holdMin: 1600, holdMax: 2400 }
      ]
    };

    // -----------------------------------------------------------------------
    // Tính sẵn danh sách nội thất cần vẽ (mỗi item kèm pixel pos + asset key),
    // đồng thời đánh dấu blocked. Gọi 1 lần.
    // -----------------------------------------------------------------------
    const drawables = [];  // { key, dx, dy } sắp xếp theo đáy (dy+h) tăng dần

    function pushDrawable(member, tileX, tileY, flipX) {
      if (!member) { return; }
      drawables.push({
        assetKey: 'furn_' + member.id,
        dx: tileX * TILE,
        dy: tileY * TILE,
        w: member.width,
        flipX: !!flipX,
        bottom: tileY * TILE + member.height
      });
    }

    function openRect(rect) {
      for (let yy = rect.y; yy < rect.y + rect.h; yy++) {
        for (let xx = rect.x; xx < rect.x + rect.w; xx++) {
          if (yy >= 0 && yy < ROWS && xx >= 0 && xx < COLS) { floorMask[yy][xx] = true; }
        }
      }
    }

    function buildLayout() {
      // Mặc định mọi ô là tường/void; chỉ mở những vùng sàn.
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) { blocked[r][c] = true; }
      }
      FLOOR_RECTS.forEach(openRect);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) { if (floorMask[r][c]) { blocked[r][c] = false; } }
      }

      const deskFront = furnMember('DESK', 'DESK_FRONT');
      const chairBack = furnMember('WOODEN_CHAIR', 'WOODEN_CHAIR_BACK');

      // 6 bàn: DESK_FRONT (3×2) + ghế (lưng) ngay dưới giữa bàn (= ô seat).
      DESKS.forEach(function (d) {
        const dx = d.deskTile.x;
        const dy = d.deskTile.y;
        if (deskFront) { pushDrawable(deskFront, dx, dy); }
        // Draw the chair tucked under the desk while keeping the walkable seat tile unchanged.
        if (chairBack) { pushDrawable(chairBack, d.seat.x, d.seat.y - 1); }
        markBlocked(dx, dy, deskFront ? deskFront.footprintW : 3, deskFront ? deskFront.footprintH : 2);
      });

      // Bàn họp = nhiều coffee table ghép thành bàn dài; chặn vùng bàn (ghế ngồi ở ô khác).
      const coffeeTable = furnMember('COFFEE_TABLE', 'COFFEE_TABLE');
      if (coffeeTable) {
        MEETING.tableTiles.forEach(function (t) {
          pushDrawable(coffeeTable, t.x, t.y);
          markBlocked(t.x, t.y, 2, 2);
        });
      }

      // Vật trang trí (noBlock = treo tường / không chặn lối đi).
      DECOR.forEach(function (item) {
        const m = furnMember(item.group, item.id);
        if (!m) { return; }
        pushDrawable(m, item.x, item.y, item.flipX);
        if (!item.noBlock) { markBlocked(item.x, item.y, m.footprintW, m.footprintH); }
      });

      PANTRY_FIXTURE_BLOCKS.forEach(function (block) {
        markBlocked(block.x, block.y, block.w, block.h);
      });

      drawables.sort(function (a, b) { return a.bottom - b.bottom; });
    }

    buildLayout();

    // -----------------------------------------------------------------------
    // Vẽ phòng theo lớp: sàn → tường → nội thất (depth-sorted)
    // -----------------------------------------------------------------------
    // Màu sàn theo zone (sáng ấm): trả [màu chẵn, màu lẻ] cho ô bàn cờ nhẹ.
    function zoneColorAt(c, r) {
      const rc = ROOMS.reception, pt = ROOMS.pantry, ms = ROOMS.mission;
      const inRect = function (rm) { return c >= rm.x && c < rm.x + rm.w && r >= rm.y && r < rm.y + rm.h; };
      if (inRect(rc)) { return ['#e7d3ac', '#dfc9a0']; }   // phòng họp — gỗ ấm
      if (inRect(pt)) {
        return (r < PANTRY_LOUNGE_SPLIT)
          ? ['#efe2c6', '#e8d8bb']        // bếp — kem ấm
          : ['#cfe0e6', '#c4d7de'];       // lounge — xanh mát nhạt (accent)
      }
      if (inRect(ms)) { return ['#ddc49b', '#d4b98f']; }   // mission control — gỗ ấm
      return ['#ead9b6', '#e2cfa8'];      // workspace + hành lang — gỗ sáng
    }

    // Sàn procedural sáng ấm, mỗi ô tô theo zone + đường ron nhẹ.
    function drawFloor(ctx) {
      ctx.save();
      ctx.fillStyle = '#cdb78f';
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!floorMask[r][c]) { continue; }
          const col = zoneColorAt(c, r);
          ctx.fillStyle = ((r + c) % 2 === 0) ? col[0] : col[1];
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
      }
      ctx.strokeStyle = 'rgba(90, 60, 30, 0.06)';
      ctx.lineWidth = 1;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (floorMask[r][c]) { ctx.strokeRect(c * TILE + 0.5, r * TILE + 0.5, TILE, TILE); }
        }
      }
      ctx.restore();
    }

    function isFloor(c, r) {
      return r >= 0 && r < ROWS && c >= 0 && c < COLS && floorMask[r][c];
    }

    // Tường sáng ấm nhưng ĐẬM hơn sàn rõ rệt + có mặt đứng/cạnh sáng để KHÔNG lẫn với sàn.
    function drawWalls(ctx) {
      ctx.save();
      const body     = '#c5ac82';            // thân tường — tông gỗ đậm hơn sàn (#e7d3ac...) rõ rệt
      const bodyEdge = '#b69a6f';            // mặt tường ĐỨNG (vách dọc), tối hơn
      const cap      = '#e6d6b4';            // đỉnh tường có nắng (mặt nhìn vào phòng dưới)
      const hi       = '#f4e9d3';            // mép sáng trên cùng / cạnh hướng vào phòng
      const shadow   = 'rgba(70, 45, 18, 0.32)';
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (floorMask[r][c]) { continue; }
          const fL = isFloor(c - 1, r), fR = isFloor(c + 1, r);
          const fU = isFloor(c, r - 1), fD = isFloor(c, r + 1);
          // Chỉ vẽ tường nếu kề sàn (8 hướng); còn lại là void.
          if (!(fL || fR || fU || fD ||
                isFloor(c - 1, r - 1) || isFloor(c + 1, r - 1) || isFloor(c - 1, r + 1) || isFloor(c + 1, r + 1))) {
            continue;
          }
          const x = c * TILE, y = r * TILE;
          ctx.fillStyle = body;
          ctx.fillRect(x, y, TILE, TILE);
          if (fD) {
            // Tường ngang nhìn từ trên (mặt trước hướng vào phòng phía dưới): nắng đỉnh + chân bóng.
            ctx.fillStyle = cap;    ctx.fillRect(x, y, TILE, 7);
            ctx.fillStyle = hi;     ctx.fillRect(x, y, TILE, 2);
            ctx.fillStyle = shadow; ctx.fillRect(x, y + TILE - 3, TILE, 3);
          } else {
            ctx.fillStyle = hi; ctx.fillRect(x, y, TILE, 2);   // rim trên cho mọi tường
          }
          // Vách ĐỨNG: tô mặt đứng tối + mép sáng ở cạnh hướng vào phòng -> nhìn rõ là tường, khác sàn.
          if (fR && !fD) {            // phòng nằm bên phải
            ctx.fillStyle = bodyEdge; ctx.fillRect(x + TILE - 6, y, 6, TILE);
            ctx.fillStyle = hi;       ctx.fillRect(x + TILE - 2, y, 2, TILE);
            ctx.fillStyle = shadow;   ctx.fillRect(x, y, 2, TILE);
          }
          if (fL && !fD) {            // phòng nằm bên trái
            ctx.fillStyle = bodyEdge; ctx.fillRect(x, y, 6, TILE);
            ctx.fillStyle = hi;       ctx.fillRect(x, y, 2, TILE);
            ctx.fillStyle = shadow;   ctx.fillRect(x + TILE - 2, y, 2, TILE);
          }
        }
      }
      ctx.restore();
    }

    // Cửa: ngưỡng sáng + 2 trụ khung để dễ nhận ra lối ra vào.
    function drawDoors(ctx) {
      ctx.save();
      DOORS.forEach(function (d) {
        const x = d.x * TILE, y = d.y * TILE;
        ctx.fillStyle = 'rgba(255, 226, 178, 0.16)';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#b59a6a';
        if (!isFloor(d.x - 1, d.y)) { ctx.fillRect(x, y, 2, TILE); }
        if (!isFloor(d.x + 1, d.y)) { ctx.fillRect(x + TILE - 2, y, 2, TILE); }
      });
      ctx.restore();
    }

    // Cửa ra vào chính ở cuối hành lang (cols45-47, rows13-14): khung trên + thảm + biển "Lối ra vào".
    function drawEntrance(ctx) {
      ctx.save();
      const x = ENTRANCE.doorX * TILE, w = 3 * TILE;
      const yTop = ENTRANCE.y0 * TILE, hAll = 2 * TILE;
      // Thảm chùi chân cam nhạt trước cửa
      ctx.fillStyle = 'rgba(240, 90, 34, 0.16)';
      ctx.fillRect(x + 2, yTop + hAll - 7, w - 4, 6);
      // Khung cửa trên (treo dưới mép tường row12)
      ctx.fillStyle = '#b59a6a';
      ctx.fillRect(x, 12 * TILE + TILE - 4, w, 4);
      ctx.fillStyle = '#9a7b4e';
      ctx.fillRect(x, 12 * TILE + TILE - 4, 3, 4);
      ctx.fillRect(x + w - 3, 12 * TILE + TILE - 4, 3, 4);
      // Biển chỉ dẫn
      ctx.fillStyle = '#5a4326';
      ctx.font = '700 6px "Be Vietnam Pro", sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Lối ra vào', x + 2, 12 * TILE + 5);
      ctx.restore();
    }

    // Khu bếp pantry (máy bán hàng, cà phê, quầy, tủ lạnh) — vẽ procedural.
    // Bố cục mới: bếp ở nửa trên phòng pantry (cols 34..44, rows 16..19).
    function drawPantry(ctx) {
      ctx.save();
      // Máy bán hàng (trái)
      let x = 35 * TILE, y = 16 * TILE;
      ctx.fillStyle = '#2f3a45'; ctx.fillRect(x + 2, y + 2, 13, 26);
      ctx.fillStyle = '#1d2730'; ctx.fillRect(x + 4, y + 4, 9, 13);
      ctx.fillStyle = '#ffd27a'; ctx.fillRect(x + 5, y + 5, 7, 2);
      ctx.fillStyle = '#7fd4c2'; ctx.fillRect(x + 5, y + 8, 7, 2);
      ctx.fillStyle = '#f4a6c0'; ctx.fillRect(x + 5, y + 11, 7, 2);
      ctx.fillStyle = '#3a4651'; ctx.fillRect(x + 4, y + 19, 9, 6);
      // Quầy bếp + bình nước: dời sang BÊN PHẢI phòng pantry (cols 41..44) để không nằm giữa lối đi.
      x = 41 * TILE; y = 17 * TILE;
      ctx.fillStyle = '#d8c9ad'; ctx.fillRect(x, y + 6, 4 * TILE, 8);
      ctx.fillStyle = '#a9926e'; ctx.fillRect(x, y + 13, 4 * TILE, 3);
      // Máy pha cà phê trên quầy
      ctx.fillStyle = '#3a3f45'; ctx.fillRect(x + 8, y + 1, 8, 6);
      ctx.fillStyle = '#7fd4c2'; ctx.fillRect(x + 9, y + 2, 3, 2);
      // Bình nước
      ctx.fillStyle = '#9fd6e8'; ctx.fillRect(x + 26, y - 2, 8, 8);
      ctx.fillStyle = '#cfeaf3'; ctx.fillRect(x + 27, y - 1, 6, 3);
      // Tủ lạnh: chuyển vào giữa (cols 38) nhường chỗ phải cho quầy.
      x = 38 * TILE; y = 16 * TILE;
      ctx.fillStyle = '#cdd6da'; ctx.fillRect(x + 1, y + 2, 13, 26);
      ctx.fillStyle = '#aeb8bd'; ctx.fillRect(x + 1, y + 14, 13, 1);
      ctx.fillStyle = '#8b969c'; ctx.fillRect(x + 11, y + 6, 2, 5);
      ctx.fillStyle = '#8b969c'; ctx.fillRect(x + 11, y + 18, 2, 5);
      ctx.restore();
    }

    function drawVngSign(ctx) {
      const x = 21 * TILE;
      const y = 1 * TILE + 5;
      const w = 6 * TILE;
      const h = 25;
      ctx.save();
      ctx.fillStyle = 'rgba(90, 60, 30, 0.16)';
      ctx.fillRect(x + 3, y + 4, w, h);
      ctx.fillStyle = '#fffdfb';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(240, 90, 34, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#f05a22';
      ctx.font = '900 18px "Be Vietnam Pro", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('VNG', x + 18, y + 13);
      ctx.fillStyle = 'rgba(154, 53, 20, 0.75)';
      ctx.font = '700 5px "Be Vietnam Pro", sans-serif';
      ctx.fillText('LaunchOps', x + 60, y + 17);
      ctx.restore();
    }

    function drawMissionControlDetails(ctx) {
      ctx.save();
      // Server rack + signal lights, tucked against the wall so it does not affect walking tiles.
      const rackX = 4 * TILE + 2;
      const rackY = 22 * TILE;
      ctx.fillStyle = '#2f3a45';
      ctx.fillRect(rackX, rackY, 14, 42);
      for (let i = 0; i < 4; i++) {
        const yy = rackY + 5 + i * 8;
        ctx.fillStyle = '#1f2730';
        ctx.fillRect(rackX + 3, yy, 8, 4);
        ctx.fillStyle = i % 2 ? '#ffd27a' : '#7fd4c2';
        ctx.fillRect(rackX + 10, yy + 1, 2, 2);
      }
      // Large mission TV: 3 signal lights + compact status text.
      // Xích phải 1 ô (col 9) để không che cửa Control Room ở col 8.
      const boardX = 9 * TILE + 10;
      const boardY = 16 * TILE + 2;
      const boardW = 58;
      const boardH = 28;
      ctx.fillStyle = 'rgba(70, 45, 18, 0.18)';
      ctx.fillRect(boardX + 3, boardY + 3, boardW, boardH);
      ctx.fillStyle = '#2d3338';
      ctx.fillRect(boardX, boardY, boardW, boardH);
      ctx.fillStyle = '#1b2025';
      ctx.fillRect(boardX + 23, boardY + boardH, 12, 3);
      ctx.fillStyle = '#fffdfb';
      ctx.fillRect(boardX + 4, boardY + 4, boardW - 8, boardH - 8);
      const lights = [
        { label: 'GO', color: '#0c7a48', x: boardX + 10 },
        { label: 'WATCH', color: '#e0a400', x: boardX + 29 },
        { label: 'STOP', color: '#b3261e', x: boardX + 48 }
      ];
      lights.forEach(function (light) {
        ctx.fillStyle = light.color;
        ctx.beginPath();
        ctx.arc(light.x, boardY + 11, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#5a4326';
      ctx.font = '800 5px "Be Vietnam Pro", sans-serif';
      ctx.fillText('GO', boardX + 6, boardY + 22);
      ctx.fillText('WATCH', boardX + 20, boardY + 22);
      ctx.fillText('STOP', boardX + 43, boardY + 22);
      ctx.restore();
    }

    function drawMeetingDetails(ctx) {
      ctx.save();
      // Interview placards on the long table.
      Room.MEETING.tableTiles.forEach(function (t, index) {
        const x = t.x * TILE + 8;
        const y = t.y * TILE + 6;
        ctx.fillStyle = index % 2 ? 'rgba(255, 253, 251, 0.82)' : 'rgba(254, 237, 230, 0.9)';
        ctx.fillRect(x, y, 13, 6);
        ctx.fillStyle = 'rgba(154, 53, 20, 0.55)';
        ctx.fillRect(x + 2, y + 2, 9, 1);
      });
      // Small camera/speaker on the upper wall.
      const camX = 28 * TILE + 4;
      const camY = 2 * TILE + 5;
      ctx.fillStyle = '#3a3f45';
      ctx.fillRect(camX, camY, 15, 8);
      ctx.fillStyle = '#7fd4c2';
      ctx.fillRect(camX + 3, camY + 2, 5, 4);
      ctx.fillStyle = '#1d2730';
      ctx.fillRect(camX + 11, camY + 2, 2, 4);
      ctx.restore();
    }

    function drawPantryDetails(ctx) {
      ctx.save();
      // Tiny cups/bottles placed on top of the two lounge tables, kept small so they do not cover the tables.
      const tableX = 39 * TILE + 9;
      const tableY = 23 * TILE + 13;
      ctx.fillStyle = '#fffdfb';
      ctx.fillRect(tableX, tableY, 3, 4);
      ctx.fillRect(tableX + 21, tableY + 1, 3, 3);
      ctx.fillStyle = '#9fd6e8';
      ctx.fillRect(tableX + 8, tableY - 2, 4, 6);
      ctx.fillStyle = '#7fd4c2';
      ctx.fillRect(tableX + 32, tableY, 4, 4);
      ctx.restore();
    }

    function drawStandingLamp(ctx, c, r) {
      const x = c * TILE + 8;
      const y = r * TILE;
      ctx.fillStyle = '#7d6747';
      ctx.fillRect(x - 1, y + 10, 2, 22);
      ctx.fillStyle = '#b59a6a';
      ctx.fillRect(x - 6, y + 31, 12, 3);
      ctx.fillStyle = '#fff4dc';
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 8);
      ctx.lineTo(x + 4, y + 8);
      ctx.lineTo(x + 8, y + 18);
      ctx.lineTo(x - 8, y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(154, 103, 0, 0.25)';
      ctx.stroke();
    }

    function drawWorkspaceDetails(ctx) {
      ctx.save();
      // Projection screen with tiny chart bars, mounted tight to the upper wall.
      const sx = 16 * TILE + 7;
      const sy = 16 * TILE + 3;
      ctx.fillStyle = '#fffdfb';
      ctx.fillRect(sx, sy, 42, 24);
      ctx.strokeStyle = 'rgba(90, 67, 38, 0.35)';
      ctx.strokeRect(sx + 0.5, sy + 0.5, 41, 23);
      ctx.fillStyle = '#0c7a48';
      ctx.fillRect(sx + 7, sy + 15, 5, 4);
      ctx.fillStyle = '#e0a400';
      ctx.fillRect(sx + 16, sy + 11, 5, 8);
      ctx.fillStyle = '#b3261e';
      ctx.fillRect(sx + 25, sy + 7, 5, 12);
      ctx.strokeStyle = 'rgba(90, 67, 38, 0.35)';
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + 19);
      ctx.lineTo(sx + 35, sy + 19);
      ctx.stroke();
      drawStandingLamp(ctx, 30, 22);
      ctx.restore();
    }

    function drawWallShelf(ctx, c, r, books) {
      const x = c * TILE + 2;
      const y = r * TILE + 5;
      ctx.fillStyle = 'rgba(70, 45, 18, 0.16)';
      ctx.fillRect(x + 1, y + 10, 25, 2);
      ctx.fillStyle = '#6f5432';
      ctx.fillRect(x, y + 8, 26, 3);
      for (let i = 0; i < books; i++) {
        const bx = x + 3 + i * 7;
        ctx.fillStyle = i % 3 === 0 ? '#7fd4c2' : (i % 3 === 1 ? '#f4a6c0' : '#ffd27a');
        ctx.fillRect(bx, y, 4, 8);
        ctx.fillStyle = '#2b2f34';
        ctx.fillRect(bx + 5, y + 1, 1, 7);
      }
    }

    function drawWallClock(ctx, c, r) {
      const x = c * TILE + 8;
      const y = r * TILE + 8;
      ctx.fillStyle = '#fffdfb';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9a3514';
      ctx.stroke();
      ctx.fillStyle = '#3a3f45';
      ctx.fillRect(x - 1, y - 4, 1, 4);
      ctx.fillRect(x, y, 4, 1);
    }

    function drawOfficeDetails(ctx) {
      ctx.save();
      drawWallShelf(ctx, 4, 16, 2);
      drawWallShelf(ctx, 28, 16, 3);
      drawWallClock(ctx, 3, 16);
      drawWallClock(ctx, 31, 16);
      drawStandingLamp(ctx, 11, 22);
      drawStandingLamp(ctx, 35, 22);
      ctx.restore();
    }

    // Màn hình máy tính đặt trên mặt bàn (thay sprite PC bị lơ lửng).
    function drawDeskMonitors(ctx) {
      ctx.save();
      DESKS.forEach(function (d) {
        const cx = (d.deskTile.x + 1.5) * TILE;
        const baseY = d.deskTile.y * TILE + 19;
        ctx.fillStyle = '#3a3f45';
        ctx.fillRect(cx - 1, baseY - 3, 2, 3);
        ctx.fillStyle = '#2b2f34';
        ctx.fillRect(cx - 4, baseY, 8, 2);
        ctx.fillStyle = '#23272c';
        ctx.fillRect(cx - 7, baseY - 13, 14, 11);
        ctx.fillStyle = '#7fd4c2';
        ctx.fillRect(cx - 6, baseY - 12, 12, 9);
        ctx.fillStyle = 'rgba(34, 60, 58, 0.55)';
        ctx.fillRect(cx - 5, baseY - 10, 7, 1);
        ctx.fillRect(cx - 5, baseY - 8, 9, 1);
        ctx.fillRect(cx - 5, baseY - 6, 5, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(cx - 6, baseY - 12, 4, 1);
      });
      ctx.restore();
    }

    function drawWarmLights(ctx) {
      const pulse = 0.93 + Math.sin(stagePulse * 0.0018) * 0.035;
      const lights = [
        { x: 384, y: 88,  radius: 130, color: '255, 214, 150', alpha: 0.12 },  // phòng họp
        { x: 128, y: 344, radius: 130, color: '255, 220, 160', alpha: 0.11 },  // mission
        { x: 384, y: 344, radius: 160, color: '255, 226, 170', alpha: 0.11 },  // workspace
        { x: 624, y: 360, radius: 140, color: '255, 232, 180', alpha: 0.10 }   // pantry/lounge
      ];
      ctx.save();
      lights.forEach(function (light, index) {
        const glow = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius * pulse);
        const strength = light.alpha + (index * 0.012);
        glow.addColorStop(0, 'rgba(' + light.color + ', ' + strength + ')');
        glow.addColorStop(0.45, 'rgba(' + light.color + ', ' + (strength * 0.46) + ')');
        glow.addColorStop(1, 'rgba(' + light.color + ', 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
      });
      ctx.restore();
    }

    function drawRoomLabel(ctx, room) {
      const labelY = (typeof room.labelY === 'number') ? room.labelY : (room.y + 1);
      const labelX = (typeof room.labelX === 'number') ? room.labelX : room.x;
      const px = labelX * TILE + 6;
      const py = labelY * TILE + 4;
      ctx.save();
      ctx.font = '700 7px "Be Vietnam Pro", sans-serif';
      ctx.textBaseline = 'top';
      const w = Math.min(room.w * TILE - 10, ctx.measureText(room.label).width + 10);
      ctx.fillStyle = 'rgba(255, 253, 251, 0.85)';
      ctx.fillRect(px - 3, py - 3, w, 12);
      ctx.fillStyle = '#5a4326';
      ctx.fillText(room.label, px + 2, py - 1);
      ctx.restore();
    }

    function drawRoomShell(ctx) {
      ctx.save();
      drawRoomLabel(ctx, ROOMS.reception);
      drawRoomLabel(ctx, ROOMS.mission);
      drawRoomLabel(ctx, ROOMS.workspace);
      drawRoomLabel(ctx, ROOMS.pantry);
      ctx.restore();
    }

    function drawOfficeOverlay(ctx) {
      drawWarmLights(ctx);
      drawPantry(ctx);
      drawVngSign(ctx);
      drawMissionControlDetails(ctx);
      drawMeetingDetails(ctx);
      drawPantryDetails(ctx);
      drawWorkspaceDetails(ctx);
      drawOfficeDetails(ctx);
      drawDoors(ctx);
      drawEntrance(ctx);
      drawRoomShell(ctx);
    }

    function drawReviewFocus(ctx) {
      const pulse = 0.82 + Math.sin(stagePulse * 0.0021) * 0.03;
      ctx.save();
      const wash = ctx.createLinearGradient(0, 0, 0, ROWS * TILE);
      wash.addColorStop(0, 'rgba(255, 246, 226, 0.03)');
      wash.addColorStop(1, 'rgba(240, 90, 34, 0.07)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

      const cxF = 23.5 * TILE, cyF = 5 * TILE;
      const focus = ctx.createRadialGradient(cxF, cyF, 12, cxF, cyF, 160 * pulse);
      focus.addColorStop(0, 'rgba(255, 210, 138, 0.20)');
      focus.addColorStop(0.42, 'rgba(240, 90, 34, 0.10)');
      focus.addColorStop(1, 'rgba(240, 90, 34, 0)');
      ctx.fillStyle = focus;
      ctx.fillRect(16 * TILE, 1 * TILE, 16 * TILE, 10 * TILE);

      ctx.strokeStyle = 'rgba(240, 120, 70, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(17 * TILE + 0.5, 3 * TILE + 0.5, 14 * TILE - 1, 6 * TILE - 1);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Thảm phân vùng (vẽ trên sàn, dưới nội thất) — chỉ trang trí, không chặn lối.
    function rug(ctx, x, y, w, h, fill, edge) {
      ctx.fillStyle = fill;
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    }
    function drawRugs(ctx) {
      ctx.save();
      // Thảm phòng họp (dưới bàn họp + 2 hàng ghế hội nghị)
      rug(ctx, 18 * TILE, 3 * TILE, 12 * TILE, 6 * TILE, 'rgba(240, 160, 90, 0.16)', 'rgba(194, 67, 26, 0.22)');
      // Thảm lounge (dưới sofa)
      rug(ctx, 35 * TILE, 22 * TILE, 8 * TILE, 5 * TILE, 'rgba(110, 150, 175, 0.20)', 'rgba(63, 90, 110, 0.32)');
      // Thảm Mission Control
      rug(ctx, 4 * TILE, 20 * TILE, 7 * TILE, 6 * TILE, 'rgba(210, 150, 90, 0.12)', 'rgba(154, 84, 40, 0.20)');
      ctx.restore();
    }

    // Cửa sổ kính trên tường ngoài (vẽ sau tường) — thêm ánh sáng/sự sống.
    function windowStrip(ctx, c, r, tiles) {
      const x = c * TILE, y = r * TILE, w = tiles * TILE;
      ctx.fillStyle = '#b59a6a'; ctx.fillRect(x, y + 1, w, TILE - 2);            // khung
      ctx.fillStyle = '#cfe6ef'; ctx.fillRect(x + 1, y + 2, w - 2, TILE - 5);    // kính
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillRect(x + 1, y + 2, w - 2, 2); // chói
      ctx.fillStyle = 'rgba(120, 150, 170, 0.45)';
      for (let i = 1; i < tiles; i++) { ctx.fillRect(x + i * TILE - 1, y + 2, 1, TILE - 5); } // nan
    }
    function drawWindows(ctx) {
      ctx.save();
      windowStrip(ctx, 20, 2, 2);   // tường trên phòng họp (trái tranh)
      windowStrip(ctx, 26, 2, 2);   // tường trên phòng họp (phải tranh)
      windowStrip(ctx, 6, 28, 4);   // tường dưới Mission Control
      windowStrip(ctx, 19, 28, 5);  // tường dưới workspace
      windowStrip(ctx, 35, 28, 5);  // tường dưới pantry/lounge
      ctx.restore();
    }

    function draw(ctx) {
      // (a) Sàn gỗ ấm procedural.
      drawFloor(ctx);

      // (a2) Thảm phân vùng (dưới nội thất).
      drawRugs(ctx);

      // (b) Tường procedural (mảng tường trên + viền + vách ngăn).
      drawWalls(ctx);

      // (b2) Cửa sổ kính trên tường ngoài.
      drawWindows(ctx);

      // (c) Nội thất — vẽ theo depth (đáy tăng dần).
      for (let i = 0; i < drawables.length; i++) {
        const it = drawables[i];
        const img = Assets.get(it.assetKey);
        if (img) {
          if (it.flipX) {
            ctx.save();
            ctx.translate(it.dx + (it.w || img.width), it.dy);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0);
            ctx.restore();
          } else {
            ctx.drawImage(img, it.dx, it.dy);
          }
        }
      }

      // (d) Màn hình máy tính đặt trên mặt bàn.
      drawDeskMonitors(ctx);

      drawOfficeOverlay(ctx);
      if (reviewFocus) { drawReviewFocus(ctx); }
    }

    function tick(dt) {
      stagePulse += clamp(dt || 16, 0, 50);
    }

    function setMood(mood) {
      reviewFocus = mood === 'review';
    }

    return {
      blocked: blocked,
      ROOMS: ROOMS,
      DESKS: DESKS,
      MEETING: MEETING,
      ENTRANCE: ENTRANCE,
      ACTIVITY_POINTS: ACTIVITY_POINTS,
      setMood: setMood,
      tick: tick,
      COLS: COLS,
      ROWS: ROWS,
      draw: draw
    };
  })();

  // ---------------------------------------------------------------------------
  // class Character — nhân vật pixel 2 ô (16×32), animation theo state.
  // Sheet 112×96: 7 cột × 3 hàng. Hàng = hướng (down0/up1/right2; left = lật row right).
  // Cột = state frame: walk[0,1,2], typing[3,4], reading[5,6].
  // ---------------------------------------------------------------------------
  class Character {
    /**
     * @param {Object} opts
     *   key      {string}  định danh agent (vd 'mission_control')
     *   name     {string}  tên hiển thị tiếng Việt
     *   sheetKey {string}  key Image trong Assets (vd 'char_0')
     *   gx, gy   {number}  ô feet (chân nhân vật ở ô gy)
     *   facing   {'up'|'down'|'left'|'right'}
     *   state    {string}  trạng thái ban đầu (mặc định 'idle')
     */
    constructor(opts) {
      opts = opts || {};
      this.key = opts.key || '';
      this.name = opts.name || '';
      this.sheetKey = opts.sheetKey || 'char_0';
      this.gx = (typeof opts.gx === 'number') ? opts.gx : 0;
      this.gy = (typeof opts.gy === 'number') ? opts.gy : 0;
      this.facing = opts.facing || 'down';

      this.state = 'idle';
      this.frameIndex = 0;     // chỉ số trong dãy frame của state hiện tại
      this.frameTimer = 0;     // ms tích luỹ để đổi frame
      this.effectTimer = 0;    // ms tích luỹ cho hiệu ứng nhún/rung (cheer/alert)
      this.offsetX = 0;        // dịch pixel ngang (rung alert)
      this.offsetY = 0;        // dịch pixel dọc (nhún cheer)
      this.path = [];
      this.moveTarget = null;
      this.moveSpeed = 4.2;
      this.onArrive = null;
      this.hidden = false;
      this.behaviorLock = false;
      this.behaviorTask = null;

      this.setState(opts.state || 'idle');
    }

    // depthY = gy → Engine sort vẽ trước/sau theo chiều sâu.
    get depthY() { return this.gy; }

    // Đặt state + reset timer/khung hình + offset hiệu ứng.
    setState(s) {
      const valid = ['idle', 'walk', 'type', 'read', 'cheer', 'alert'];
      if (valid.indexOf(s) === -1) { s = 'idle'; }
      this.state = s;
      this.frameIndex = 0;
      this.frameTimer = 0;
      this.effectTimer = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    }

    // Dãy cột frame theo state (ánh xạ vào CHAR_FRAMES của sheet walk/type/read).
    _frameCols() {
      // Đang di chuyển thì LUÔN dùng frame đi bộ, bất kể state — tránh "đi mà ngồi/đọc".
      if (this.moveTarget) {
        return [CHAR_FRAMES.walk[0], CHAR_FRAMES.walk[1], CHAR_FRAMES.walk[0], CHAR_FRAMES.walk[2]];
      }
      switch (this.state) {
        case 'walk':
          // chu kỳ nhún chân: walk0, walk1, walk0, walk2
          return [CHAR_FRAMES.walk[0], CHAR_FRAMES.walk[1], CHAR_FRAMES.walk[0], CHAR_FRAMES.walk[2]];
        case 'type':
          return [CHAR_FRAMES.typing[0], CHAR_FRAMES.typing[1]];
        case 'read':
          return [CHAR_FRAMES.reading[0], CHAR_FRAMES.reading[1]];
        case 'alert':
          // dùng cột reading[0], rung ngang (xử lý ở update)
          return [CHAR_FRAMES.reading[0]];
        case 'cheer':
          // dùng cột walk[0], nhún dọc (xử lý ở update)
          return [CHAR_FRAMES.walk[0]];
        case 'idle':
        default:
          // đứng yên cột walk[0]
          return [CHAR_FRAMES.walk[0]];
      }
    }

    // Nhịp đổi frame (ms) theo state.
    _frameInterval() {
      if (this.moveTarget) { return 150; }   // đang đi -> nhịp bước chân
      switch (this.state) {
        case 'walk': return 150;
        case 'type': return 300;
        case 'read': return 300;
        default:     return 1000; // idle/cheer/alert không cần đổi cột
      }
    }

    // Hàng sheet theo hướng (left dùng row right + lật).
    _row() {
      switch (this.facing) {
        case 'up':    return CHAR_ROW.up;
        case 'down':  return CHAR_ROW.down;
        case 'right': return CHAR_ROW.right;
        case 'left':  return CHAR_ROW.right; // vẽ lật ngang
        default:      return CHAR_ROW.down;
      }
    }

    _faceToward(target) {
      const dx = target.x - this.gx;
      const dy = target.y - this.gy;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx >= 0 ? 'right' : 'left';
      } else if (Math.abs(dy) > 0) {
        this.facing = dy >= 0 ? 'down' : 'up';
      }
    }

    _move(dt) {
      if (!this.moveTarget) { return; }
      const curX = this.gx * TILE;
      const curY = this.gy * TILE;
      const targetX = this.moveTarget.x * TILE;
      const targetY = this.moveTarget.y * TILE;
      const dx = targetX - curX;
      const dy = targetY - curY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const step = this.moveSpeed * TILE * (dt / 1000);

      if (distance <= step) {
        this.gx = this.moveTarget.x;
        this.gy = this.moveTarget.y;
        this.path.shift();
        if (this.path.length > 1) {
          this.moveTarget = this.path[1];
          this._faceToward(this.moveTarget);
        } else {
          this.path = [];
          this.moveTarget = null;
          const arrive = this.onArrive;
          this.onArrive = null;
          if (this.state === 'walk') {
            this.setState('idle');
          }
          if (typeof arrive === 'function') {
            arrive(this);
          }
        }
        return;
      }

      this.gx = (curX + (dx / distance) * step) / TILE;
      this.gy = (curY + (dy / distance) * step) / TILE;
    }

    walkTo(gx, gy, onArrive) {
      this.behaviorTask = null;
      const path = bfsPath({ x: Math.round(this.gx), y: Math.round(this.gy) }, { x: gx, y: gy });
      if (!path || path.length < 2) {
        this.path = path || [];
        this.moveTarget = null;
        this.onArrive = null;
        return false;
      }
      this.path = path;
      this.moveTarget = path[1];
      this.onArrive = (typeof onArrive === 'function') ? onArrive : null;
      this._faceToward(this.moveTarget);
      this.setState('walk');
      return true;
    }

    update(dt) {
      this._move(dt);
      const cols = this._frameCols();

      // Đổi frame theo nhịp (chỉ khi có nhiều hơn 1 frame).
      if (cols.length > 1) {
        this.frameTimer += dt;
        const interval = this._frameInterval();
        while (this.frameTimer >= interval) {
          this.frameTimer -= interval;
          this.frameIndex = (this.frameIndex + 1) % cols.length;
        }
      } else {
        this.frameIndex = 0;
      }

      // Hiệu ứng nhún (cheer) / rung (alert).
      this.offsetX = 0;
      this.offsetY = 0;
      if (this.state === 'cheer') {
        this.effectTimer += dt;
        // nhún dọc ~2px theo sin, chu kỳ ~0.4s
        this.offsetY = -Math.abs(Math.sin(this.effectTimer / 400 * Math.PI * 2)) * 2;
      } else if (this.state === 'alert') {
        this.effectTimer += dt;
        // rung ngang ±1px nhanh
        this.offsetX = (Math.sin(this.effectTimer / 80 * Math.PI * 2) >= 0) ? 1 : -1;
      }
    }

    draw(ctx) {
      if (this.hidden) { return; }
      const sheet = Assets.get(this.sheetKey);
      if (!sheet) { return; }

      const cols = this._frameCols();
      const col = cols[this.frameIndex % cols.length];
      const row = this._row();

      const sx = col * CHAR_FW;
      const sy = row * CHAR_FH;
      const sw = CHAR_FW;
      const sh = CHAR_FH;

      // Feet ở ô gy → đỉnh sprite cao 2 ô: dy = (gy-1)*TILE.
      // Snap về lưới device-pixel (logic × RENDER_SCALE) để hết rung/giật do toạ độ lẻ.
      const snap = function (v) { return Math.round(v * RENDER_SCALE) / RENDER_SCALE; };
      const dx = snap(this.gx * TILE + this.offsetX);
      const dy = snap((this.gy - 1) * TILE + this.offsetY);

      if (this.facing === 'left') {
        // Lật ngang: dịch tới mép phải rồi scale(-1,1), vẽ tại 0,0.
        ctx.save();
        ctx.translate(dx + CHAR_FW, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, sx, sy, sw, sh, 0, 0, CHAR_FW, CHAR_FH);
        ctx.restore();
      } else {
        ctx.drawImage(sheet, sx, sy, sw, sh, dx, dy, CHAR_FW, CHAR_FH);
      }
      this.drawNameLabel(ctx, dx + (CHAR_FW / 2), dy + CHAR_FH + 2);
    }

    drawNameLabel(ctx, cx, y) {
      const meta = agentMetaFor(this.key);
      const persona = !meta && DemoData && DemoData.personas
        ? DemoData.personas.find(function (item) { return item.key === this.key; }, this)
        : null;
      if (!meta && !persona) { return; }
      const label = meta ? (meta.shortName || meta.name) : persona.name;
      const activePersona = !meta && PERSONA_LINKS.some(function (item) {
        return item.key === this.key && item.active;
      }, this);
      ctx.save();
      ctx.font = '700 7px "Be Vietnam Pro", sans-serif';
      ctx.textBaseline = 'top';
      const padX = 4;
      const h = 11;
      const textW = Math.min(70, Math.ceil(ctx.measureText(label).width));
      const boxW = textW + padX * 2;
      const x = clamp(cx - boxW / 2, 2, COLS * TILE - boxW - 2);
      const top = clamp(y, 2, ROWS * TILE - h - 2);
      ctx.fillStyle = activePersona ? 'rgba(254, 237, 230, 0.96)' : 'rgba(255, 253, 248, 0.86)';
      ctx.fillRect(x, top, boxW, h);
      ctx.strokeStyle = activePersona ? 'rgba(240, 90, 34, 0.7)' : 'rgba(96, 82, 70, 0.18)';
      ctx.strokeRect(x + 0.5, top + 0.5, boxW - 1, h - 1);
      ctx.fillStyle = activePersona ? '#9a3514' : 'rgba(39, 31, 27, 0.88)';
      ctx.fillText(label, x + padX, top + 2, textW);
      ctx.restore();
    }
  } // end class Character

  // ---------------------------------------------------------------------------
  // 6 agent gắn vào DESKS — mỗi agent 1 char sheet riêng.
  // ---------------------------------------------------------------------------
  const AGENT_META = {
    mission_control:  { sheetKey: 'char_0', name: 'Mission Control Agent (Henzy)', shortName: 'Henzy', role: 'Điều phối flow launch', statusMap: { idle: 'Đang giữ nhịp demo', walk: 'Đang đi kiểm tra phòng', read: 'Đang đọc brief', type: 'Đang giao việc', alert: 'Đang gom tín hiệu rủi ro', cheer: 'Đang chốt vòng tốt' } },
    launch_readiness: { sheetKey: 'char_1', name: 'Launch Readiness Agent (Layla)', shortName: 'Layla', role: 'Chấm readiness Green / Yellow / Red', statusMap: { idle: 'Đang chờ brief', walk: 'Đang đổi vị trí theo dõi', read: 'Đang rà điều kiện launch', type: 'Đang chấm điểm', alert: 'Đang thấy thiếu sót', cheer: 'Đang xác nhận launch khỏe hơn' } },
    red_team:         { sheetKey: 'char_2', name: 'Red Team Agent (Nick)', shortName: 'Nick', role: 'Dẫn hội đồng phản biện', statusMap: { idle: 'Đang chờ gọi phản biện', walk: 'Đang vào phòng tiếp khách', read: 'Đang đọc risk card', type: 'Đang tổng hợp ý kiến', alert: 'Đang phản biện căng', cheer: 'Đang chốt rủi ro đã rõ' } },
    checklist:        { sheetKey: 'char_3', name: 'Checklist Agent (Rocky)', shortName: 'Rocky', role: 'Biến rủi ro thành việc phải làm', statusMap: { idle: 'Đang chờ rủi ro', walk: 'Đang đổi vị trí làm việc', read: 'Đang rà action cũ', type: 'Đang tạo checklist', alert: 'Đang đánh dấu việc gấp', cheer: 'Đang xác nhận checklist rõ hơn' } },
    postmortem:       { sheetKey: 'char_4', name: 'Post-mortem & Lessons Agent (John)', shortName: 'John', role: 'Rút bài học và lưu memory', statusMap: { idle: 'Đang chờ outcome', walk: 'Đang sang khu lessons', read: 'Đang đọc outcome', type: 'Đang ghi lesson', alert: 'Đang soi điểm lặp lại', cheer: 'Đang chốt memory tốt hơn' } },
    assistant:        { sheetKey: 'char_5', name: 'LaunchOps Assistant / Channel Agent (Amanda)', shortName: 'Amanda', role: 'MC dẫn chuyện và hỗ trợ chat', statusMap: { idle: 'Đang chờ tương tác', walk: 'Đang hỗ trợ quanh văn phòng', read: 'Đang đọc brief phụ', type: 'Đang giải thích cho khách xem', alert: 'Đang nhắc điểm cần chú ý', cheer: 'Đang mời xem lượt 2' } }
  };

  const Characters = Object.create(null);  // key → Character
  const PersonaCharacters = Object.create(null);
  const PERSONA_LINKS = [];

  // 10 persona hội đồng phản biện: 5 người đầu (hàng dưới) phát biểu chính và lộ risk card;
  // 5 người sau (hàng trên) ngồi nghe, gật gù cho phòng họp đông đủ. riskIndex khớp 1-1 với run1.risks.
  const DEMO_PERSONAS = [
      { key: 'persona_angry_user', name: 'Angry user', sheetKey: 'char_0', facing: 'up', spawn: { x: 47, y: 13 }, seat: Room.MEETING.seats[0], bubble: 'Nếu quà giới hạn hết quá sớm mà không ai xử lý, người chơi sẽ phản ứng rất mạnh.', riskIndex: 0 },
      { key: 'persona_exploit_hunter', name: 'Exploit hunter', sheetKey: 'char_1', facing: 'up', spawn: { x: 47, y: 14 }, seat: Room.MEETING.seats[1], bubble: 'Nếu logic quay hoặc hoàn thưởng lỗi, sẽ có người tìm cách trục lợi ngay và chi phí thưởng vượt trần.', riskIndex: 4 },
      { key: 'persona_cs_lead', name: 'CS lead', sheetKey: 'char_3', facing: 'up', spawn: { x: 46, y: 13 }, seat: Room.MEETING.seats[2], bubble: 'Thiếu kịch bản trả lời thì CSKH sẽ trả lời chậm và khiếu nại bùng lên.', riskIndex: 2 },
      { key: 'persona_tech_oncall', name: 'Tech on-call', sheetKey: 'char_2', facing: 'up', spawn: { x: 46, y: 14 }, seat: Room.MEETING.seats[3], bubble: 'Không có cảnh báo quá tải thì kỹ thuật sẽ bị động khi giờ cao điểm tăng đột biến.', riskIndex: 3 },
      { key: 'persona_business_owner', name: 'Business owner', sheetKey: 'char_4', facing: 'up', spawn: { x: 45, y: 14 }, seat: Room.MEETING.seats[4], bubble: 'Mục tiêu chỉ nói tăng doanh thu mà không có con số cụ thể thì rất khó quyết Go hay No-Go.', riskIndex: 1 },
      { key: 'persona_data_analyst', name: 'Data analyst', sheetKey: 'char_5', facing: 'down', spawn: { x: 45, y: 13 }, seat: Room.MEETING.seats[5] },
      { key: 'persona_marketing_lead', name: 'Marketing lead', sheetKey: 'char_4', facing: 'down', spawn: { x: 47, y: 13 }, seat: Room.MEETING.seats[6] },
      { key: 'persona_payment_owner', name: 'Payment owner', sheetKey: 'char_2', facing: 'down', spawn: { x: 46, y: 14 }, seat: Room.MEETING.seats[7] },
      { key: 'persona_game_designer', name: 'Game designer', sheetKey: 'char_1', facing: 'down', spawn: { x: 47, y: 14 }, seat: Room.MEETING.seats[8] },
      { key: 'persona_legal', name: 'Pháp chế', sheetKey: 'char_3', facing: 'down', spawn: { x: 46, y: 13 }, seat: Room.MEETING.seats[9] }
    ];

  // Flow chậm, tuần tự: mỗi bước = agent đi tới nơi -> dừng "làm việc" -> mới nói -> bàn giao.
  const DEMO_PHASES = [
      {
        // Phase 0 — Brief: Amanda nhận brief từ Human, đưa Henzy phân phối, rồi chuyển cho Layla.
        actions: [
          { at: 200,   type: 'state',  character: 'assistant', state: 'type' },
          { at: 600,   type: 'bubble', character: 'assistant', text: 'Em nhận được brief từ Human rồi. Em mang qua Henzy nhé.', textOptions: ['Em nhận được brief từ Human rồi. Em mang qua Henzy nhé.', 'Brief từ Human vừa tới. Em chuyển qua Henzy trước nhé.', 'Em đã nhận brief Human. Em qua Henzy để phân việc nha.'], ms: 2600 },
          { at: 1800,  type: 'walk',   character: 'assistant', to: { x: 10, y: 20, facing: 'left', state: 'read' } },
          { at: 5600,  type: 'bubble', character: 'assistant', text: 'Henzy, brief mới tới. Anh xem phân việc giúp em.', textOptions: ['Henzy, brief mới tới. Anh xem phân việc giúp em.', 'Henzy, brief Human đây. Anh chia nhịp giúp em nhé.', 'Henzy, em chuyển brief qua. Anh xem nên giao ai trước nhé.'], ms: 2800 },
          { at: 7400,  type: 'bubble', character: 'mission_control', text: 'Ok. Đưa Layla chấm độ sẵn sàng trước. Xong bảo Layla mang kết quả lại anh xem.', textOptions: ['Ok. Đưa Layla chấm độ sẵn sàng trước. Xong bảo Layla mang kết quả lại anh xem.', 'Anh nhận. Chuyển Layla chấm trước, rồi bảo Layla quay lại báo anh.', 'Được. Layla soi độ sẵn sàng trước; có kết quả thì mang lại anh duyệt.'], ms: 3200 },
          { at: 11200, type: 'walk',   character: 'assistant', to: { x: 18, y: 20, facing: 'left', state: 'read' } },
          { at: 14600, type: 'bubble', character: 'assistant', text: 'Layla, brief mới đây. Henzy nhờ em chấm độ sẵn sàng trước.', textOptions: ['Layla, brief mới đây. Henzy nhờ em chấm độ sẵn sàng trước.', 'Layla, Henzy chuyển brief cho em chấm độ sẵn sàng trước nhé.', 'Layla, brief Human tới rồi. Em soi độ sẵn sàng giúp Henzy trước nha.'], ms: 3000 },
          { at: 16200, type: 'bubble', character: 'launch_readiness', text: 'Em nhận. Em phân tích xong sẽ mang qua Henzy.', textOptions: ['Em nhận. Em phân tích xong sẽ mang qua Henzy.', 'Rõ rồi. Em chấm xong sẽ quay lại báo Henzy.', 'Ok Amanda. Em đọc kỹ rồi mang kết quả qua Henzy.'], ms: 2600 },
          { at: 17400, type: 'walk',   character: 'assistant', to: { x: 19, y: 26, facing: 'up', state: 'type' } },
          { at: 18000, type: 'state',  character: 'launch_readiness', state: 'type' },
          { at: 20200, type: 'bubble', character: 'launch_readiness', text: 'Em đang đối chiếu tiêu chí chấm. Cho em vài giây để kiểm kỹ.', textOptions: ['Em đang đối chiếu tiêu chí chấm. Cho em vài giây để kiểm kỹ.', 'Em đang rà phương án xử lý sự cố, kịch bản CSKH và cảnh báo quá tải. Đợi em chút nhé.', 'Em kiểm kỹ trước đã, điểm sẵn sàng phải có bằng chứng.'], ms: 2800 },
          { at: 21200, type: 'hold',   ms: 24000 }
        ]
      },
      {
        // Phase 1 — Chấm điểm: Layla phân tích, mang Henzy xem, rồi mới chuyển hồ sơ cho Nick.
        actions: [
          { at: 200,  type: 'state',  character: 'launch_readiness', state: 'type' },
          { at: 800,  type: 'bubble', character: 'launch_readiness', text: 'Em đang đối chiếu tiêu chí chấm. Cho em vài giây để kiểm kỹ.', textOptions: ['Em đang đối chiếu tiêu chí chấm. Cho em vài giây để kiểm kỹ.', 'Em đang rà brief với danh mục điều kiện sẵn sàng. Chờ em chút nha.', 'Em đọc kỹ phần xử lý sự cố, CSKH và tải hệ thống trước.'], ms: 3000 },
          { at: 4300, type: 'bubble', character: 'mission_control', text: 'Anh chờ kết quả của Layla trước. Có điểm rõ rồi mình mới đưa sang Nick.', textOptions: ['Anh chờ kết quả của Layla trước. Có điểm rõ rồi mình mới đưa sang Nick.', 'Cứ để Layla chấm xong đã. Sau đó mình mới mời Nick vào.', 'Phải có kết quả độ sẵn sàng trước rồi Nick mới soi tiếp được.'], ms: 2800 },
          { at: 5600, type: 'walk',   character: 'launch_readiness', to: { x: 10, y: 20, facing: 'left', state: 'read' } },
          { at: 9600, type: 'bubble', character: 'launch_readiness', text: 'Henzy ơi, em chấm xong rồi. Brief đang Vàng 6/12, thiếu phương án xử lý sự cố, kịch bản CSKH và cảnh báo quá tải.', textOptions: ['Henzy ơi, em chấm xong rồi. Brief đang Vàng 6/12, thiếu phương án xử lý sự cố, kịch bản CSKH và cảnh báo quá tải.', 'Henzy, kết quả là Vàng 6/12. Phương án xử lý sự cố, kịch bản CSKH và cảnh báo quá tải còn thiếu.', 'Em có điểm rồi: Vàng 6/12. Chưa đủ phanh ở phần xử lý sự cố, CSKH và theo dõi quá tải.'], ms: 3600 },
          { at: 10800, type: 'gauge' },
          { at: 13000, type: 'bubble', character: 'mission_control', text: 'Anh đồng ý mức Vàng. Chưa Go ngay. Layla, mang hồ sơ qua Nick để hội đồng phản biện soi tiếp.', textOptions: ['Anh đồng ý mức Vàng. Chưa Go ngay. Layla, mang hồ sơ qua Nick để hội đồng phản biện soi tiếp.', 'Ổn, giữ mức Vàng. Em chuyển qua Nick để phản biện tiếp nhé.', 'Anh duyệt kết quả này. Đưa Nick soi đa góc nhìn trước khi chốt.'], ms: 3200 },
          { at: 14600, type: 'walk',   character: 'launch_readiness', to: { x: 21, y: 20, facing: 'right', state: 'read' } },
          { at: 18000, type: 'bubble', character: 'launch_readiness', text: 'Nick, Henzy đã xem rồi. Đây là hồ sơ cần hội đồng phản biện.', textOptions: ['Nick, Henzy đã xem rồi. Đây là hồ sơ cần hội đồng phản biện.', 'Nick, hồ sơ đã qua Henzy. Anh giúp team soi đa góc nhìn nhé.', 'Nick, độ sẵn sàng đang Vàng. Henzy nhờ anh phản biện tiếp.'], ms: 3200 },
          { at: 20000, type: 'bubble', character: 'red_team', text: 'Tôi nhận. Tôi mời hội đồng phản biện vào phòng họp để soi rủi ro.', textOptions: ['Tôi nhận. Tôi mời hội đồng phản biện vào phòng họp để soi rủi ro.', 'Được. Tôi mời hội đồng vào để bóc từng góc rủi ro.', 'Tôi sẽ đưa hồ sơ này lên phòng họp và hỏi từng thành viên.'], ms: 2800 },
          { at: 21600, type: 'walk',   character: 'launch_readiness', to: { x: 18, y: 20, facing: 'up', state: 'idle' } },
          { at: 22800, type: 'hold',   ms: 26000 }
        ]
      },
      { actions: [] },
      {
        // Phase 3 — Việc cần làm: Nick về workspace giao risk cards cho Rocky, Rocky giao John.
        actions: [
          { at: 200,  type: 'walk',   character: 'red_team', to: { x: 26, y: 20, facing: 'right', state: 'read' } },
          { at: 2600, type: 'bubble', character: 'red_team', text: 'Rocky, đây là các rủi ro vừa bóc. Biến giúp tôi thành việc cần làm có người phụ trách và hạn chót.', ms: 2800 },
          { at: 3600, type: 'state',  character: 'checklist', state: 'type' },
          { at: 4200, type: 'bubble', character: 'checklist', text: 'Em đang gom rủi ro thành việc cụ thể. Đợi em gán người phụ trách và hạn chót trước.', ms: 2800 },
          { at: 7400, type: 'checklist' },
          { at: 8200, type: 'bubble', character: 'checklist', text: 'Đã chốt thành việc phải làm. John, phần kết quả thực tế và bài học tôi bàn giao cho anh.', ms: 2800 },
          { at: 9500, type: 'bubble', character: 'postmortem', text: 'Tôi nhận. Tôi sẽ ghi bài học để lần launch sau đỡ lặp lỗi.', ms: 2600 },
          { at: 10400, type: 'hold',  ms: 12000 }
        ]
      },
      {
        // Phase 4 — Bài học: John chốt lesson, nhờ Amanda tóm tắt cho channel.
        actions: [
          { at: 200,  type: 'state',  character: 'postmortem', state: 'read' },
          { at: 700,  type: 'bubble', character: 'postmortem', text: 'Tôi đang đối chiếu kết quả thực tế với rủi ro vừa chốt. Đợi tôi ghi bài học gọn trước.', ms: 2800 },
          { at: 3900, type: 'lessons' },
          { at: 4500, type: 'bubble', character: 'postmortem', text: 'Bài học chính: event quay thưởng phải diễn tập phương án xử lý sự cố, có kịch bản CSKH và mức trần ngân sách.', ms: 3000 },
          { at: 6200, type: 'bubble', character: 'postmortem', text: 'Amanda, tóm tắt ngắn cho nhóm chung giúp tôi: rủi ro đã chốt, người phụ trách đã rõ.', ms: 2600 },
          { at: 7600, type: 'bubble', character: 'assistant', text: 'Đã rõ. Em gửi tóm tắt ngắn cho team qua nhóm chung, rồi cả nhà quay lại nhịp làm việc nhé.', ms: 2800 },
          { at: 8800, type: 'cheer-all' },
          { at: 10000, type: 'hold',  ms: 11800 }
        ]
      }
    ];

  const DEMO_STORY_MODES = {
    sample: {
      launchId: 'golden-spin-retro-lessons',
      title: 'Golden Spin: Vòng Quay Rồng Vàng cuối tuần',
      briefLabel: 'Brief mẫu',
      shortBrief: [
        'Brief mẫu Golden Spin',
        '- Tên event: Golden Spin: Vòng Quay Rồng Vàng cuối tuần.',
        '- Thời gian: 20:00 Thứ Sáu đến 23:59 Chủ Nhật.',
        '- Nội dung: người chơi đăng nhập, làm nhiệm vụ ngày và nạp gói cuối tuần để nhận lượt quay; giải gồm skin Rồng Vàng, vé boss bang hội, vàng khóa và voucher nạp.',
        '- Mục tiêu: kéo người chơi quay lại cuối tuần, đạt 120.000 lượt quay, tăng 8% doanh thu nạp và giữ khiếu nại dưới 2%.',
        '- Kênh chạy: in-game banner, fanpage, Discord cộng đồng và tin nhắn CSKH.',
        '- Vì sao lượt 1 vẫn Vàng: brief còn thiếu người được quyền dừng event, kịch bản CSKH khi hết quà, mức trần ngân sách thưởng và cảnh báo quá tải lúc 20:00.'
      ].join('\n'),
      aiSuggestedBriefAdditions: [
        'Bổ sung mốc vận hành: mở event 20:00 Thứ Sáu, kiểm tra cao điểm 20:00-21:00, khóa báo cáo tạm lúc 10:00 Thứ Bảy và tổng kết lúc 09:00 Thứ Hai.',
        'Ghi rõ chốt an toàn: LiveOps được quyền tạm dừng nếu lỗi quay thưởng vượt 1%, queue quá tải trên 5 phút hoặc ngân sách thưởng chạm 85%.',
        'Chuẩn bị kịch bản CSKH cho 3 tình huống: hết quà giới hạn, người chơi không nhận lượt quay, bảng xếp hạng cập nhật chậm.'
      ],
      humanOutcomeInput: 'Team xác nhận sau lượt 1: đã diễn tập phương án sự cố lúc 15:00, gắn LiveOps làm người được quyền tạm dừng, khóa mức trần thưởng 450 triệu, bật cảnh báo quá tải 20:00-21:00 và bàn giao kịch bản CSKH cho ca trực.',
      derivedLessons: [
        'Lượt 1 giữ màu Vàng vì brief còn thiếu quyền tạm dừng, kịch bản CSKH, mức trần thưởng và cảnh báo quá tải.',
        'Muốn chuyển Xanh, team phải ghi rõ bằng chứng đã làm: ai chịu trách nhiệm, diễn tập lúc nào, cảnh báo nào đã bật và ngân sách trần là bao nhiêu.',
        'Lượt 2 chuyển Xanh vì các rủi ro chính của lượt 1 đã được khóa thành checklist có người phụ trách, thời hạn và trạng thái đã xác nhận.'
      ],
      memoryLesson: 'Lần sau với event quay thưởng cuối tuần, hệ thống sẽ hỏi ngay 4 điểm trước khi chấm Xanh: ai được quyền tạm dừng, ngân sách thưởng tối đa, kịch bản CSKH và cảnh báo quá tải giờ mở event.',
      run1: {
        score: 7,
        maxScore: 12,
        readinessLabel: 'Vàng',
        readinessColor: 'warning',
        summary: 'Golden Spin có tên event, thời gian, nội dung thưởng, mục tiêu và kênh chạy khá rõ nên không bị Đỏ. Tuy vậy lượt 1 vẫn Vàng vì các chốt vận hành sống còn còn thiếu: quyền tạm dừng, kịch bản CSKH, trần ngân sách và cảnh báo quá tải.',
        risks: [
          { title: 'Chưa chốt quyền tạm dừng event', owner: 'LiveOps', note: 'Brief có nói cần xử lý sự cố nhưng chưa ghi rõ ai được quyền tạm dừng lúc 20:00 nếu lỗi quay thưởng lan rộng.' },
          { title: 'Mức trần thưởng chưa được khóa', owner: 'PM / Kinh doanh', note: 'Mục tiêu doanh thu đã có, nhưng ngân sách thưởng tối đa và ngưỡng cảnh báo 85% chưa được ghi vào brief.' },
          { title: 'Thiếu kịch bản CSKH khi hết quà', owner: 'CS lead', note: 'Chưa có câu trả lời thống nhất cho người chơi khi skin giới hạn hết sớm hoặc lượt quay không cộng đúng.' },
          { title: 'Chưa bật cảnh báo quá tải giờ mở event', owner: 'Kỹ thuật trực', note: 'Khung 20:00-21:00 dễ tăng đột biến, nhưng brief chưa ghi dashboard theo dõi và người trực nhận cảnh báo.' },
          { title: 'Chưa có mốc tổng kết bài học', owner: 'Tổng kết', note: 'Event có mục tiêu rõ nhưng chưa đặt lịch tổng kết để lưu lại bài học cho lần chạy tiếp theo.' }
        ],
        checklist: [
          { task: 'Ghi rõ LiveOps được quyền tạm dừng khi lỗi quay thưởng vượt 1% hoặc queue quá tải trên 5 phút', owner: 'LiveOps', deadline: 'Trước 15:00 Thứ Sáu', status: 'Mở' },
          { task: 'Khóa mức trần thưởng 450 triệu và cảnh báo khi dùng 85% ngân sách', owner: 'PM / Kinh doanh', deadline: 'Trước 16:00 Thứ Sáu', status: 'Mở' },
          { task: 'Viết kịch bản CSKH cho hết quà, không cộng lượt quay và bảng xếp hạng cập nhật chậm', owner: 'CS lead', deadline: 'Trước 17:00 Thứ Sáu', status: 'Mở' },
          { task: 'Bật cảnh báo quá tải 20:00-21:00 và phân công kỹ thuật trực', owner: 'Kỹ thuật trực', deadline: 'Trước 18:00 Thứ Sáu', status: 'Mở' }
        ]
      },
      run2: {
        score: 11,
        maxScore: 12,
        readinessLabel: 'Xanh',
        readinessColor: 'success',
        summary: 'Lượt 2 chuyển Xanh vì team đã dùng checklist của lượt 1 để khóa các lỗ hổng chính: có người được quyền tạm dừng, có diễn tập lúc 15:00, có trần thưởng 450 triệu, có kịch bản CSKH và có cảnh báo quá tải cho giờ mở event.',
        risks: [
          { title: 'Theo dõi sát 30 phút đầu', owner: 'Kỹ thuật trực', note: 'Cảnh báo đã bật, nhưng vẫn cần người trực nhìn dashboard trong khung 20:00-20:30.' },
          { title: 'CSKH phải dùng đúng kịch bản mới', owner: 'CS lead', note: 'Bộ câu trả lời đã bàn giao; ca trực cần dùng chung một nội dung để tránh trả lời lệch.' }
        ],
        checklist: [
          { task: 'Đã diễn tập phương án sự cố lúc 15:00 và ghi người duyệt tạm dừng', owner: 'LiveOps / Kỹ thuật', deadline: 'Đã xong 15:30 Thứ Sáu', status: 'Đã khóa' },
          { task: 'Đã bật cảnh báo ngân sách 85% và giới hạn thưởng 450 triệu', owner: 'PM / Kinh doanh', deadline: 'Đã xong 16:20 Thứ Sáu', status: 'Đã khóa' },
          { task: 'Đã bàn giao kịch bản CSKH cho 3 tình huống chính', owner: 'CS lead', deadline: 'Đã xong 17:10 Thứ Sáu', status: 'Đã khóa' },
          { task: 'Kỹ thuật trực theo dõi dashboard 20:00-21:00 và tổng kết bài học 09:00 Thứ Hai', owner: 'Kỹ thuật trực / Tổng kết', deadline: 'Đã phân công', status: 'Đã khóa' }
        ]
      }
    },
    real: {
      launchId: 'golden-spin-retro-lessons',
      title: 'Brief thật của bạn',
      briefLabel: 'Brief thật',
      shortBrief: 'Tình huống thực tế do bạn nhập vào. Hệ thống phân tích thật và giữ đánh giá thận trọng.',
      aiSuggestedBriefAdditions: [
        'AI đề nghị ghi rõ mục tiêu, đối tượng người chơi và mức tối thiểu của phương án xử lý sự cố.',
        'AI đề nghị chỉ rõ người phụ trách cho mục tiêu, đội CSKH và kỹ thuật trực trước khi nâng lên mức Xanh.',
        'AI đề nghị bổ sung kết quả mong muốn để bộ nhớ hệ thống rút bài học đúng ngữ cảnh.'
      ],
      humanOutcomeInput: 'Team xác nhận sau lượt 1: đã bổ sung người phụ trách, mục tiêu, phương án xử lý sự cố và vài chốt an toàn, nhưng vẫn còn điểm chưa chắc.',
      derivedLessons: [
        'Brief thật thường thiếu người phụ trách và chốt an toàn ngay ở dòng đầu.',
        'AI bổ sung giúp lộ khoảng trống, nhưng không tự động biến tình huống thật thành an toàn tuyệt đối.',
        'Bộ nhớ hệ thống nên nhắc những phần hay thiếu lặp lại: phương án xử lý sự cố, CSKH, cảnh báo quá tải và kết quả thực tế.'
      ],
      memoryLesson: 'Với brief thật, hệ thống nhớ các lỗ hổng lặp lại để lượt sau hỏi rõ người phụ trách, mục tiêu, phương án xử lý sự cố và kết quả trước khi nâng mức tin cậy.',
      run1: {
        score: 6,
        maxScore: 12,
        readinessLabel: 'Vàng',
        readinessColor: 'warning',
        summary: 'Tình huống thật có tín hiệu tiềm năng nhưng brief còn mơ hồ; cần giữ mức Vàng để tránh quá tự tin.',
        risks: [
          { title: 'Chưa rõ người phụ trách', owner: 'Điều phối', note: 'Một số đầu việc nói chung chung nhưng chưa chỉ rõ ai chốt.' },
          { title: 'Phương án xử lý sự cố chưa đủ chi tiết', owner: 'Vận hành', note: 'Có nhắc nhưng thiếu điều kiện kích hoạt và người chịu trách nhiệm.' },
          { title: 'Kết quả mong muốn chưa chốt', owner: 'PM / Kinh doanh', note: 'Chưa rõ tiêu chí thắng-thua của launch nên khó quyết định nhanh.' }
        ],
        checklist: [
          { task: 'Bổ sung người phụ trách rõ cho từng đầu việc chính', owner: 'Điều phối', deadline: 'Ngay sau lượt 1', status: 'Mở' },
          { task: 'Viết điều kiện kích hoạt phương án xử lý sự cố và người duyệt', owner: 'Vận hành / Kỹ thuật', deadline: 'Trước launch 1 ngày', status: 'Mở' },
          { task: 'Chốt kết quả mong muốn và ngưỡng dừng', owner: 'PM / Kinh doanh', deadline: 'Trước launch 1 ngày', status: 'Mở' }
        ]
      },
      run2: {
        score: 8,
        maxScore: 12,
        readinessLabel: 'Vàng tốt hơn',
        readinessColor: 'warning',
        summary: 'Lượt 2 tốt hơn nhờ AI bổ sung và bài học từ bộ nhớ, nhưng brief thật vẫn giữ mức Vàng để phản ánh sự thận trọng cần có.',
        risks: [
          { title: 'Vài chốt an toàn vẫn ở mức bản nháp', owner: 'PM / Kỹ thuật', note: 'Đã bổ sung nhưng chưa đủ bằng chứng diễn tập hoặc bảng theo dõi.' },
          { title: 'Kết quả thực tế cần theo dõi sau launch', owner: 'Tổng kết', note: 'Bộ nhớ đã ghi bài học, nhưng cần hậu kiểm để xác nhận quyết định.' }
        ],
        checklist: [
          { task: 'Xác nhận người phụ trách và kết quả trên một bảng chung', owner: 'Điều phối', deadline: 'Trước launch 6 giờ', status: 'Đang làm' },
          { task: 'Chạy thử phương án xử lý sự cố và cảnh báo quá tải', owner: 'Kỹ thuật trực', deadline: 'Trước launch 4 giờ', status: 'Đang làm' },
          { task: 'Chốt bài học nền cho lần launch tiếp theo', owner: 'Tổng kết', deadline: 'Sau launch 1 ngày', status: 'Mở' }
        ]
      }
    }
  };

  const DemoData = {
    launchId: 'golden-spin-retro-lessons',
    storyModes: DEMO_STORY_MODES,
    personas: DEMO_PERSONAS,
    phases: DEMO_PHASES,
    selectedMode: 'sample',
    activeRunKey: 'run1',
    humanOutcomeDirty: false
  };

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function applyStoryMode(modeKey) {
    const nextKey = DemoData.storyModes[modeKey] ? modeKey : 'sample';
    const story = DemoData.storyModes[nextKey];
    const run1 = cloneData(story.run1);
    const run2 = cloneData(story.run2);
    DemoData.selectedMode = nextKey;
    DemoData.activeRunKey = 'run1';
    DemoData.launchId = story.launchId;
    DemoData.title = story.title;
    DemoData.briefLabel = story.briefLabel;
    DemoData.shortBrief = story.shortBrief;
    DemoData.aiSuggestedBriefAdditions = cloneData(story.aiSuggestedBriefAdditions || []);
    DemoData.humanOutcomeInput = story.humanOutcomeInput || '';
    DemoData.derivedLessons = cloneData(story.derivedLessons || []);
    DemoData.memoryLesson = story.memoryLesson || '';
    DemoData.run1 = run1;
    DemoData.run2 = run2;
    DemoData.score = run1.score;
    DemoData.maxScore = run1.maxScore;
    DemoData.readinessLabel = run1.readinessLabel;
    DemoData.readinessColor = run1.readinessColor;
    DemoData.summary = run1.summary;
    DemoData.risks = cloneData(run1.risks || []);
    DemoData.checklist = cloneData(run1.checklist || []);
    DemoData.lessons = cloneData(story.derivedLessons || []);
    DemoData.humanOutcomeDirty = false;
    return DemoData;
  }

  function normalizeText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function getBriefInputElements() {
    return {
      sampleButton: document.getElementById('demoBriefSample'),
      realOption: document.getElementById('demoBriefRealOption'),
      realInput: document.getElementById('demoBriefReal')
    };
  }

  function syncBriefModeUI(modeKey) {
    const els = getBriefInputElements();
    const isReal = modeKey === 'real';
    if (els.sampleButton) {
      els.sampleButton.classList.toggle('is-active', !isReal);
      els.sampleButton.setAttribute('aria-pressed', isReal ? 'false' : 'true');
    }
    if (els.realOption) {
      els.realOption.classList.toggle('is-active', isReal);
      els.realOption.setAttribute('aria-pressed', isReal ? 'true' : 'false');
    }
    if (els.realInput) {
      if (isReal) {
        // Brief thật: nếu ô đang giữ text mẫu thì xoá cho user tự nhập.
        if (els.realInput.dataset.holds === 'sample') { els.realInput.value = ''; }
        els.realInput.dataset.holds = 'real';
        els.realInput.readOnly = false;
        els.realInput.classList.remove('is-readonly');
        els.realInput.placeholder = 'Dán brief thật vào đây để phân tích bằng AI...';
      } else {
        // Brief mẫu: đổ nội dung brief mẫu, chỉ đọc.
        const sampleStory = DemoData.storyModes.sample;
        els.realInput.value = (sampleStory && sampleStory.shortBrief) || '';
        els.realInput.dataset.holds = 'sample';
        els.realInput.readOnly = true;
        els.realInput.classList.add('is-readonly');
      }
    }
    const hint = document.getElementById('demoBriefHint');
    if (hint) {
      hint.textContent = isReal
        ? 'Bạn tự nhập brief thật — sẽ phân tích bằng AI thật.'
        : 'Đang xem brief mẫu (chỉ đọc). Bấm "Brief thật" để tự nhập.';
    }
  }

  function deriveRealStoryFromInput(customBrief, baseStory) {
    const source = baseStory || DemoData.storyModes.real;
    const nextStory = cloneData(source);
    const brief = normalizeText(customBrief) || source.shortBrief;
    const outcome = normalizeText(DemoData.humanOutcomeInput) || source.humanOutcomeInput;
    nextStory.shortBrief = brief;
    nextStory.aiSuggestedBriefAdditions = [
      'AI đề nghị ghi rõ mục tiêu, chốt an toàn và mốc quyết định cho brief: ' + brief.slice(0, 72) + (brief.length > 72 ? '...' : ''),
      'AI đề nghị chỉ rõ người phụ trách cho phương án xử lý sự cố, CSKH và kỹ thuật trực để giảm vùng mơ hồ ngay sau lượt 1.',
      'AI đề nghị thêm kết quả thực tế ngắn để bộ nhớ hiểu lần launch này đang cải thiện điều gì.'
    ];
    nextStory.humanOutcomeInput = outcome;
    nextStory.derivedLessons = [
      'Brief thật nên có người phụ trách, chốt an toàn và mục tiêu ngay từ đầu để tránh suy đoán lan rộng.',
      'Kết quả thực tế từ team giúp bộ nhớ phân biệt việc đã khóa được gì và điều gì vẫn còn phải theo dõi.',
      'AI bổ sung chỉ đáng tin khi team viết lại bằng ngôn ngữ vận hành cụ thể, không tô hồng kết quả.'
    ];
    nextStory.memoryLesson = 'Bộ nhớ ghi nhớ brief thật này còn thiếu người phụ trách, phương án xử lý sự cố và kết quả rõ ràng; lần sau hệ thống sẽ hỏi thẳng 3 điểm đó từ lượt đầu.';
    nextStory.run1.summary = 'Tình huống thật lấy trực tiếp từ brief vừa nhập nên hệ thống giữ mức Vàng, nhấn mạnh các khoảng trống cần làm rõ trước khi tăng độ tin cậy.';
    nextStory.run2.summary = 'Lượt 2 phản ánh brief đã được AI bổ sung và kết quả team xác nhận, tạo cảm giác bộ nhớ thật hơn nhưng vẫn giữ đánh giá thận trọng.';
    nextStory.run2.checklist = [
      { task: 'Xác nhận brief bổ sung đã chèn đúng người phụ trách và mục tiêu', owner: 'Điều phối', deadline: 'Ngay sau lượt 1', status: 'Đang làm' },
      { task: 'Đối chiếu kết quả team với phương án xử lý sự cố và chốt an toàn', owner: 'Tổng kết / Vận hành', deadline: 'Trước launch 6 giờ', status: 'Đang làm' },
      { task: 'Ghim bài học nền cho lượt launch tiếp theo', owner: 'Tổng kết', deadline: 'Sau launch 1 ngày', status: 'Mở' }
    ];
    return nextStory;
  }

  function getOutcomeFieldMarkup() {
    return '<div class="demo-outcome-capture">' +
      '<div class="demo-story-subtitle">Team xác nhận sau checklist</div>' +
      '<label class="demo-outcome-label" for="demoOutcomeInput">Ví dụ: đã diễn tập phương án sự cố, chốt mục tiêu và bàn giao kịch bản CSKH.</label>' +
      '<textarea id="demoOutcomeInput" class="demo-brief-textarea demo-outcome-textarea" rows="3" placeholder="Nhập 1-2 câu ngắn về việc team đã làm sau khi xử lý checklist..."></textarea>' +
      '<div id="demoOutcomeHint" class="demo-muted demo-outcome-hint">Nội dung này được đưa sang lượt 2 như memory của hệ thống.</div>' +
    '</div>';
  }

  function bindOutcomeInput() {
    const input = document.getElementById('demoOutcomeInput');
    if (!input || input.__demoBound) { return; }
    input.__demoBound = true;
    input.value = DemoData.humanOutcomeInput || '';
    input.addEventListener('input', function () {
      DemoData.humanOutcomeInput = String(input.value || '');
      DemoData.humanOutcomeDirty = true;
      renderRerunResult();
    });
  }

  function collectOutcomeInput() {
    const input = document.getElementById('demoOutcomeInput');
    if (!input) { return normalizeText(DemoData.humanOutcomeInput); }
    DemoData.humanOutcomeInput = String(input.value || '');
    DemoData.humanOutcomeDirty = true;
    return normalizeText(DemoData.humanOutcomeInput);
  }

  function getOutcomeMemoryLine() {
    const outcome = normalizeText(DemoData.humanOutcomeInput);
    if (!outcome) {
      return 'Memory đang chờ team xác nhận 1-2 câu để làm ngữ cảnh cho lượt 2.';
    }
    return 'Memory ghi nhận từ team: ' + outcome;
  }

  function getActiveRunData() {
    return DemoData[DemoData.activeRunKey] || DemoData.run1;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeReadinessColor(value, fallback) {
    const colorRaw = String(value || '').toLowerCase();
    if (colorRaw.indexOf('green') >= 0 || colorRaw.indexOf('xanh') >= 0 || colorRaw.indexOf('success') >= 0) {
      return 'success';
    }
    if (colorRaw.indexOf('red') >= 0 || colorRaw.indexOf('do') >= 0 || colorRaw.indexOf('đỏ') >= 0 || colorRaw.indexOf('error') >= 0) {
      return 'error';
    }
    if (colorRaw.indexOf('yellow') >= 0 || colorRaw.indexOf('vang') >= 0 || colorRaw.indexOf('vàng') >= 0 || colorRaw.indexOf('warning') >= 0) {
      return 'warning';
    }
    return fallback || 'warning';
  }

  function summarizeBriefForReasoning() {
    const brief = String(DemoData.shortBrief || '').trim();
    if (!brief) { return 'Brief hiện tại chưa có nội dung cụ thể.'; }
    if (brief.length <= 160) { return brief; }
    return brief.slice(0, 157) + '...';
  }

  function buildReasoningItems(options) {
    const opts = options || {};
    const runData = opts.runData || getActiveRunData();
    const additions = (opts.aiSuggestedBriefAdditions && opts.aiSuggestedBriefAdditions.length ? opts.aiSuggestedBriefAdditions : (DemoData.aiSuggestedBriefAdditions || [])).slice(0, 3);
    const risks = (opts.risks && opts.risks.length ? opts.risks : (runData.risks || [])).slice(0, 3);
    const statusLabel = opts.statusLabel || (opts.source === 'api' ? 'API thật' : 'Fallback deterministic');
    const decision = opts.decision || ('Giữ mức ' + (runData.readinessLabel || 'Vàng') + ' cho đến khi người chịu trách nhiệm, chốt an toàn và bước xác nhận cuối được khóa.');
    const memoryLine = getOutcomeMemoryLine();
    return [
      {
        step: '1',
        title: 'Đọc brief',
        summary: summarizeBriefForReasoning(),
        status: statusLabel
      },
      {
        step: '2',
        title: 'Dò thiếu sót',
        summary: additions.length ? additions[0] : 'Agent kiểm tra xem brief đã có mục tiêu đo được, phương án sự cố, người chịu trách nhiệm và kịch bản CSKH chưa.',
        status: additions.length > 1 ? additions[1] : 'Tập trung vào các khoảng trống ảnh hưởng quyết định launch.'
      },
      {
        step: '3',
        title: 'Soi rủi ro',
        summary: risks.length ? risks.map(function (risk) { return risk.title; }).join(' · ') : 'Chưa có rủi ro nổi bật được tách riêng.',
        status: risks[0] ? risks[0].owner : 'Theo dõi liên phòng ban'
      },
      {
        step: '4',
        title: 'Đề xuất bổ sung',
        summary: additions[2] || additions[1] || 'Bổ sung các dữ kiện còn thiếu để lượt phân tích sau bớt mơ hồ hơn.',
        status: DemoData.activeRunKey === 'run2' ? memoryLine : 'Chuẩn bị enrich cho lượt tiếp theo'
      },
      {
        step: '5',
        title: 'Tổng hợp quyết định',
        summary: decision,
        status: 'Kết luận cuối để team ra quyết định Go/No-Go'
      }
    ];
  }

  function renderReasoningPanel(items, meta) {
    const root = document.getElementById('demoReasoning');
    if (!root) { return; }
    const info = meta || {};
    const tone = info.tone || 'idle';
    const statusText = info.statusText || '';
    const fallbackText = info.fallbackText || '';
    let html = '';
    if (statusText) {
      html += '<div class="demo-reasoning-status demo-reasoning-status-' + escapeHtml(tone) + '">' +
        '<strong>' + escapeHtml(statusText) + '</strong>' +
        (fallbackText ? '<span>' + escapeHtml(fallbackText) + '</span>' : '') +
      '</div>';
    }
    html += (items || []).map(function (item) {
      return '<article class="demo-reasoning-item">' +
        '<div class="demo-reasoning-step">Bước ' + escapeHtml(item.step) + '</div>' +
        '<div class="demo-reasoning-body">' +
          '<strong>' + escapeHtml(item.title) + '</strong>' +
          '<p>' + escapeHtml(item.summary) + '</p>' +
          '<span>' + escapeHtml(item.status) + '</span>' +
        '</div>' +
      '</article>';
    }).join('');
    root.innerHTML = html;
  }

  function getStoryTone() {
    return DemoData.selectedMode === 'sample' ? 'sample' : 'real';
  }

  function getStoryStepMeta(stepKey) {
    const tone = getStoryTone();
    const activeRun = DemoData.activeRunKey || 'run1';
    const map = {
      run1: {
        label: 'Lượt 1',
        title: tone === 'sample' ? 'Đọc brief gốc và chấm readiness ban đầu' : 'Đọc brief thật và giữ đánh giá bảo thủ',
        summary: tone === 'sample'
          ? 'LaunchOps chấm nhanh độ sẵn sàng từ brief ban đầu, rồi mở đường cho Red Team bóc tách rủi ro.'
          : 'LaunchOps đọc brief thật, nhận diện phần còn mơ hồ và chủ động giữ mức tin cậy vừa phải ở lượt đầu.',
        state: activeRun === 'run1' ? 'is-active' : 'is-complete'
      },
      ai_additions: {
        label: 'AI bổ sung',
        title: tone === 'sample' ? 'AI enrich brief để lấp khoảng trống quyết định' : 'AI gợi ý bổ sung nhưng không tô hồng case thật',
        summary: tone === 'sample'
          ? 'AI đề nghị điền KPI, rollback, FAQ và owner để brief đủ chất liệu cho lượt phân tích đẹp hơn.'
          : 'AI chỉ ra phần còn thiếu như owner, guardrail và outcome mong muốn để team bổ sung trung thực hơn.',
        state: activeRun === 'run1' ? 'is-pending' : 'is-complete'
      },
      run2: {
        label: 'Lượt 2',
        title: tone === 'sample' ? 'Phân tích lại sau enrich và checklist' : 'Phân tích lại sau enrich nhưng vẫn giữ kiểm soát kỳ vọng',
        summary: tone === 'sample'
          ? 'Khi brief đã đầy đủ hơn, readiness tăng rõ và câu chuyện launch trông sáng sủa hơn.'
          : 'Khi brief thật được bổ sung, hệ thống cho kết quả chắc hơn nhưng vẫn không nhảy vội lên màu Xanh.',
        state: activeRun === 'run2' ? 'is-active' : 'is-pending'
      },
      memory: {
        label: 'Bài học đã ghi nhớ',
        title: tone === 'sample' ? 'Memory khóa lesson để lần sau vào việc nhanh hơn' : 'Memory giữ lại các lỗ hổng lặp lại của brief thật',
        summary: tone === 'sample'
          ? 'Những gì team vừa học được sẽ trở thành prompt nhắc việc cho các launch tiếp theo.'
          : 'Các lỗ hổng lặp lại như owner, rollback và outcome sẽ được nhớ để lần sau hỏi thẳng từ đầu.',
        state: activeRun === 'run2' ? 'is-active' : 'is-pending'
      }
    };
    return map[stepKey];
  }

  function renderStorySkeleton() {
    const gauge = byId('resGauge');
    const risks = byId('resRisks');
    const checklist = byId('resChecklist');
    const lessons = byId('resLessons');
    if (!gauge || !risks || !checklist || !lessons) { return; }

    const run1Meta = getStoryStepMeta('run1');
    const enrichMeta = getStoryStepMeta('ai_additions');
    const run2Meta = getStoryStepMeta('run2');
    const memoryMeta = getStoryStepMeta('memory');

    gauge.innerHTML =
      '<div class="demo-card-title">Chấm điểm sẵn sàng</div>' +
      '<div class="demo-story-section demo-story-readiness">' +
        '<div class="demo-story-head">' +
          '<span class="demo-story-chip ' + run1Meta.state + '">' + run1Meta.label + '</span>' +
          '<div class="demo-story-copy"><strong>' + run1Meta.title + '</strong><span>' + run1Meta.summary + '</span></div>' +
        '</div>' +
        '<div class="demo-story-placeholder">Chờ Launch Readiness Agent chấm điểm và mở câu chuyện lượt đầu.</div>' +
      '</div>';

    const resolvedRun1Risks = (DemoData.activeRunKey === 'run2' && DemoData.run1 && (DemoData.run1.risks || []).length)
      ? '<div class="demo-story-divider"></div>' +
        '<div class="demo-story-subtitle">Rủi ro lượt 1 đã khóa</div>' +
        '<div class="demo-list demo-list-risks-resolved">' + DemoData.run1.risks.map(function (risk) {
          return '<div class="demo-risk-card is-resolved"><strong>' + escapeHtml(risk.title) + '</strong><em>Owner: ' + escapeHtml(risk.owner) + '</em></div>';
        }).join('') + '</div>'
      : '';
    risks.innerHTML =
      '<div class="demo-card-title">Phản biện rủi ro</div>' +
      '<div class="demo-story-section demo-story-risks">' +
        '<div class="demo-story-head">' +
          '<span class="demo-story-chip is-pending">Thẻ rủi ro</span>' +
          '<div class="demo-story-copy"><strong>Red Team sẽ bóc từng rủi ro</strong><span>Hội đồng phản biện lần lượt nêu rủi ro để team biết phải khóa gì trước launch.</span></div>' +
        '</div>' +
        '<div class="demo-list demo-list-risks"></div>' +
        resolvedRun1Risks +
      '</div>';

      checklist.innerHTML =
      '<div class="demo-card-title">AI bổ sung + Việc cần làm</div>' +
      '<div class="demo-story-section demo-story-checklist">' +
        '<div class="demo-story-head">' +
          '<span class="demo-story-chip ' + enrichMeta.state + '">' + enrichMeta.label + '</span>' +
          '<div class="demo-story-copy"><strong>' + enrichMeta.title + '</strong><span>' + enrichMeta.summary + '</span></div>' +
        '</div>' +
        '<div class="demo-brief-additions">' +
          '<div class="demo-story-subtitle">Gợi ý bổ sung brief</div>' +
          '<div class="demo-list demo-list-additions"></div>' +
        '</div>' +
        '<div class="demo-story-divider"></div>' +
        getOutcomeFieldMarkup() +
        '<div class="demo-story-divider"></div>' +
        '<div class="demo-checklist-block">' +
          '<div class="demo-story-head demo-story-head-compact">' +
            '<span class="demo-story-chip ' + run2Meta.state + '">' + run2Meta.label + '</span>' +
            '<div class="demo-story-copy"><strong>' + run2Meta.title + '</strong><span>' + run2Meta.summary + '</span></div>' +
          '</div>' +
          '<div class="demo-story-subtitle">Checklist khóa action</div>' +
          '<div class="demo-list demo-list-checklist"></div>' +
        '</div>' +
      '</div>';

    lessons.innerHTML =
      '<div class="demo-card-title">Bài học + Lượt 2</div>' +
      '<div class="demo-story-section demo-story-lessons">' +
        '<div class="demo-story-head">' +
          '<span class="demo-story-chip ' + memoryMeta.state + '">' + memoryMeta.label + '</span>' +
          '<div class="demo-story-copy"><strong>' + memoryMeta.title + '</strong><span>' + memoryMeta.summary + '</span></div>' +
        '</div>' +
        '<div class="demo-story-subtitle">Bài học rút ra</div>' +
        '<div class="demo-list demo-list-lessons"></div>' +
        '<div class="demo-story-divider"></div>' +
        '<div class="demo-story-subtitle">Kết quả lượt 2</div>' +
        '<div class="demo-rerun-box"><div class="demo-story-placeholder">Sau khi chốt lesson và enrich, kết quả lượt 2 sẽ hiện ở đây.</div></div>' +
      '</div>';
  }

  function renderSuggestedAdditions() {
    const host = document.querySelector('#resChecklist .demo-list-additions');
    if (!host) { return; }
    const additions = (DemoData.aiSuggestedBriefAdditions || []).slice();
    host.innerHTML = additions.map(function (item, index) {
      return '<div class="demo-llm-note">' +
        '<strong>Gợi ý ' + (index + 1) + '</strong>' +
        '<span>' + escapeHtml(item) + '</span>' +
      '</div>';
    }).join('');
    if (!additions.length) {
      host.innerHTML = '<div class="demo-story-placeholder">Chưa có gợi ý bổ sung brief.</div>';
    }
  }

  function renderRerunResult() {
    const host = document.querySelector('#resLessons .demo-rerun-box');
    if (!host) { return; }
    const run2 = DemoData.run2 || {};
    const isSample = DemoData.selectedMode === 'sample';
    const outcome = normalizeText(DemoData.humanOutcomeInput);
    const note = isSample
      ? 'Với brief mẫu, lượt 2 được phép sáng và đẹp hơn vì AI enrich + checklist đã bù đủ dữ kiện cần thiết.'
      : 'Với brief thật, lượt 2 chỉ tiến lên trong phạm vi có bằng chứng; LaunchOps vẫn giữ giọng điệu trung thực và bảo thủ.';
    host.innerHTML = '<div class="demo-rerun-card">' +
      '<div class="demo-rerun-head">' +
        '<span class="demo-story-chip ' + (DemoData.activeRunKey === 'run2' ? 'is-active' : 'is-pending') + '">Lượt 2</span>' +
        '<strong>' + escapeHtml((run2.readinessLabel || 'Vàng') + ' · ' + (run2.score || 0) + '/' + (run2.maxScore || 12)) + '</strong>' +
      '</div>' +
      '<div class="demo-rerun-outcome' + (outcome ? '' : ' is-empty') + '"><strong>Xác nhận của team đưa sang lượt 2</strong><span>' + escapeHtml(outcome || 'Chưa có xác nhận từ team. Sau checklist, nhập 1-2 câu ngắn để memory kéo sang lượt 2.') + '</span></div>' +
      '<p>' + escapeHtml(run2.summary || '') + '</p>' +
      '<span>' + escapeHtml(note) + '</span>' +
      '<div class="demo-rerun-memory">' + escapeHtml(getOutcomeMemoryLine()) + '</div>' +
    '</div>';
  }

  applyStoryMode('sample');

  function buildCharacters() {
    Room.DESKS.forEach(function (d) {
      const meta = AGENT_META[d.key];
      if (!meta) { return; }
      if (Characters[d.key]) { return; }
      const ch = new Character({
        key: d.key,
        name: meta.name,
        sheetKey: meta.sheetKey,
        gx: d.seat.x,
        gy: d.seat.y,
        facing: d.facing,   // 'up'
        state: 'idle'
      });
      Characters[d.key] = ch;
      Engine.entities.push(ch);
    });
  }

  function ensurePersonas() {
    if (Object.keys(PersonaCharacters).length) { return PersonaCharacters; }
    DemoData.personas.forEach(function (persona) {
      const ch = new Character({
        key: persona.key,
        name: persona.name,
        sheetKey: persona.sheetKey,
        gx: persona.spawn.x,
        gy: persona.spawn.y,
        facing: persona.facing,
        state: 'idle'
      });
      ch.moveSpeed = 5.5;   // persona đi nhanh hơn agent (đường từ cửa vào dài hơn)
      ch.hidden = true;
      PersonaCharacters[persona.key] = ch;
      Engine.entities.push(ch);
    });
    return PersonaCharacters;
  }

  function getCharacter(key) {
    return Characters[key] || PersonaCharacters[key] || null;
  }

  function getAllCharacters() {
    return Object.keys(Characters).map(function (key) { return Characters[key]; });
  }

  function deskForAgent(key) {
    return Room.DESKS.find(function (item) { return item.key === key; }) || null;
  }

  function agentMetaFor(key) {
    return AGENT_META[key] || null;
  }

  function describeAgentState(ch) {
    const meta = agentMetaFor(ch.key);
    if (!meta) { return 'Đang hoạt động'; }
    return (meta.statusMap && meta.statusMap[ch.state]) || 'Đang hoạt động';
  }

  function getPersonaScreenPoint(persona) {
    return {
      x: persona.gx * TILE + (TILE / 2),
      y: persona.gy * TILE - 10
    };
  }

  const AgentBehavior = (function () {
    const slots = Object.create(null);
    let lastChatterAt = 0;
    let lastApiChatterAt = 0;
    let chatterWindowStart = 0;
    let chatterRequestCount = 0;
    let chatterPending = false;
    let nextHuddleAt = 0;
    let activeHuddleUntil = 0;
    const chatterQueue = [];
    const CHATTER_WINDOW_MS = 10 * 60 * 1000;
    const MAX_CHATTER_REQUESTS_PER_WINDOW = 30;
    const CHATTER_LINES = [
      '{listener}, phần rollback này mình khóa owner chưa?',
      '{listener}, em check KPI giúp anh nhé.',
      '{listener}, FAQ CS cần xong trước giờ G đó.',
      '{listener}, ai đang giữ deadline phần monitoring?',
      '{listener}, ổn rồi, nhớ ghi lesson lại luôn.',
      '{listener}, pantry còn cà phê không? Tôi cần tỉnh để soi risk.',
      '{listener}, AI nhanh thật nhưng checklist vẫn phải rõ owner.',
      '{listener}, Sài Gòn mưa là peak traffic tối nay phải có người trực.',
      '{listener}, giá vàng biến động thì campaign thưởng càng cần guardrail.',
      '{listener}, tin nóng cứ để sau, brief thiếu rollback là phải xử trước.',
      '{listener}, giá xăng nhảy nhẹ thôi cũng nên nhớ biên chi phí vận hành.',
      '{listener}, thời tiết Sài Gòn thất thường, mình giữ ca trực chắc nhé.',
      '{listener}, AI lọc tín hiệu nhanh, nhưng Go/No-Go vẫn cần bằng chứng.'
    ];

    function baseSeatFor(key) {
      const desk = Room.DESKS.find(function (item) { return item.key === key; });
      return desk ? desk.seat : { x: 2, y: 2 };
    }

    function pointKey(point) {
      return point.x + ',' + point.y;
    }

    function register(key) {
      if (slots[key]) { return slots[key]; }
      const home = baseSeatFor(key);
      slots[key] = {
        cooldown: Math.random() * 1800,
        holdUntil: 0,
        currentZone: 'desk',
        targetPoint: { x: home.x, y: home.y },
        assignedPointKey: pointKey(home),
        waitState: 'idle'
      };
      return slots[key];
    }

    function isClaimed(point, ownerKey) {
      const key = pointKey(point);
      return Object.keys(slots).some(function (agentKey) {
        const slot = slots[agentKey];
        return agentKey !== ownerKey && slot.assignedPointKey === key && slot.holdUntil > performance.now();
      });
    }

    function choosePoint(agentKey, points, fallback) {
      const available = (points || []).filter(function (point) {
        return !Room.blocked[point.y][point.x] && !isClaimed(point, agentKey);
      });
      return choose(available) || fallback;
    }

    function makeHold(now, point) {
      const min = point.holdMin || 1200;
      const max = point.holdMax || min;
      return now + min + Math.floor(Math.random() * Math.max(1, max - min + 1));
    }

    function applyPointBehavior(ch, point, now) {
      const slot = register(ch.key);
      slot.targetPoint = { x: point.x, y: point.y };
      slot.assignedPointKey = pointKey(point);
      slot.holdUntil = makeHold(now, point);
      slot.waitState = point.state || 'idle';
      ch.facing = point.facing || ch.facing;
      ch.setState(slot.waitState);
      slot.cooldown = slot.holdUntil + 300 + Math.floor(Math.random() * 900);
    }

    function resetChatterWindow(now) {
      if (!chatterWindowStart || now - chatterWindowStart > CHATTER_WINDOW_MS) {
        chatterWindowStart = now;
        chatterRequestCount = 0;
      }
    }

    function canRequestChatter(now) {
      resetChatterWindow(now);
      return !chatterPending && chatterRequestCount < MAX_CHATTER_REQUESTS_PER_WINDOW && now - lastApiChatterAt > 20000;
    }

    function shortNameFor(ch) {
      const meta = ch ? agentMetaFor(ch.key) : null;
      return (meta && (meta.shortName || meta.name)) || (ch && ch.name) || (ch && ch.key) || 'bạn';
    }

    function fallbackChatterLine(speaker, listener) {
      return choose(CHATTER_LINES)
        .replace(/\{speaker\}/g, shortNameFor(speaker))
        .replace(/\{listener\}/g, shortNameFor(listener));
    }

    function requestApiChatter(speaker, listener, directorPhase, now) {
      if (!window.fetch || !canRequestChatter(now)) { return; }
      chatterPending = true;
      lastApiChatterAt = now;
      chatterRequestCount += 1;
      window.fetch('/api/demo/chatter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: directorPhase,
          agents: [
            { key: speaker.key, name: agentMetaFor(speaker.key)?.shortName || speaker.name || speaker.key },
            { key: listener.key, name: agentMetaFor(listener.key)?.shortName || listener.name || listener.key }
          ],
          context: 'idle office pantry chatter',
          maxLines: 4
        })
      })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          const lines = data && Array.isArray(data.lines) ? data.lines : [];
          lines.slice(0, 4).forEach(function (line) {
            if (!line || !line.text) { return; }
            chatterQueue.push({
              character: line.character || speaker.key,
              text: String(line.text).slice(0, 120)
            });
          });
        })
        .catch(function () {})
        .finally(function () { chatterPending = false; });
    }

    function sendToPoint(ch, point, zone, now) {
      const slot = register(ch.key);
      slot.currentZone = zone;
      // Giữ chỗ đích NGAY khi xuất phát để agent khác không nhắm cùng ô (tránh đè nhau khi tới).
      slot.assignedPointKey = pointKey(point);
      slot.holdUntil = now + 9000;
      ch.behaviorTask = { zone: zone, point: point };
      const moved = ch.walkTo(point.x, point.y, function (self) {
        // Bắt đầu "dừng làm việc" tính từ lúc TỚI NƠI (không phải lúc xuất phát) -> đứng yên đủ lâu, đỡ giật.
        applyPointBehavior(self, point, performance.now());
      });
      if (!moved) {
        applyPointBehavior(ch, point, now);
      }
    }

    function officeTargetFor(ch) {
      const deskPoints = Room.ACTIVITY_POINTS.desks[ch.key] || [baseSeatFor(ch.key)];
      const slot = register(ch.key);
      const homePoint = choosePoint(ch.key, deskPoints, deskPoints[0]);
      const now = performance.now();
      const sharedZones = [
        { zone: 'lounge', points: Room.ACTIVITY_POINTS.lounge, weight: 3 },
        { zone: 'whiteboard', points: Room.ACTIVITY_POINTS.whiteboard, weight: 2 },
        { zone: 'huddle', points: Room.ACTIVITY_POINTS.huddle, weight: 4 },
        { zone: 'cafe', points: Room.ACTIVITY_POINTS.cafe, weight: 3 }
      ];
      if (activeHuddleUntil > now && Math.random() < 0.72) {
        const socialZones = [
          { zone: 'huddle', points: Room.ACTIVITY_POINTS.huddle },
          { zone: 'cafe', points: Room.ACTIVITY_POINTS.cafe },
          { zone: 'lounge', points: Room.ACTIVITY_POINTS.lounge }
        ];
        const social = Math.random() < 0.7 ? socialZones[0] : (choose(socialZones.slice(1)) || socialZones[1]);
        return {
          zone: social.zone,
          point: choosePoint(ch.key, social.points, homePoint)
        };
      }
      if (slot.currentZone !== 'desk' && Math.random() < 0.62) {
        return { zone: 'desk', point: homePoint };
      }
      if (Math.random() < 0.52) {
        return { zone: 'desk', point: homePoint };
      }
      const bag = [];
      sharedZones.forEach(function (zone) {
        for (let i = 0; i < zone.weight; i++) { bag.push(zone); }
      });
      const choice = choose(bag) || sharedZones[0];
      return {
        zone: choice.zone,
        point: choosePoint(ch.key, choice.points, homePoint)
      };
    }

    function reviewTargetFor(ch) {
      if (ch.key === 'red_team') {
        // CHỈ Nick lên phòng họp, ngồi ghế trên nhìn xuống persona.
        return {
          zone: 'review',
          point: { x: Room.MEETING.redSeat.x, y: Room.MEETING.redSeat.y, facing: 'right', state: 'alert', holdMin: 3200, holdMax: 4600 }
        };
      }
      // Các agent khác KHÔNG tham gia phỏng vấn — ngồi tại bàn của mình theo dõi & làm việc.
      const seat = baseSeatFor(ch.key);
      return { zone: 'desk', point: { x: seat.x, y: seat.y, facing: 'up', state: 'read', holdMin: 3200, holdMax: 5200 } };
    }

    function maybeStartHuddle(now) {
      if (now < nextHuddleAt || activeHuddleUntil > now) { return; }
      const pool = getAllCharacters().filter(function (ch) {
        return !ch.hidden && !ch.behaviorLock && !ch.moveTarget && (!ch.path || ch.path.length === 0);
      });
      if (pool.length < 2) {
        nextHuddleAt = now + 5000;
        return;
      }
      activeHuddleUntil = now + 8500 + Math.floor(Math.random() * 4500);
      nextHuddleAt = now + 18000 + Math.floor(Math.random() * 16000);
      const zones = [
        { zone: 'huddle', points: Room.ACTIVITY_POINTS.huddle },
        { zone: 'cafe', points: Room.ACTIVITY_POINTS.cafe },
        { zone: 'lounge', points: Room.ACTIVITY_POINTS.lounge }
      ];
      const choice = Math.random() < 0.65 ? zones[0] : (choose(zones.slice(1)) || zones[1]);
      const center = choice.points[0];
      const shuffled = pool.slice().sort(function (a, b) {
        const da = Math.abs(a.gx - center.x) + Math.abs(a.gy - center.y) + Math.random() * 2;
        const db = Math.abs(b.gx - center.x) + Math.abs(b.gy - center.y) + Math.random() * 2;
        return da - db;
      });
      const count = Math.min(choice.points.length, 2 + Math.floor(Math.random() * 2), shuffled.length);
      for (let i = 0; i < count; i++) {
        const point = choosePoint(shuffled[i].key, choice.points, choice.points[i % choice.points.length]);
        sendToPoint(shuffled[i], point, choice.zone, now);
      }
      window.setTimeout(function () {
        if (Director.isScripting()) { return; }
        const speaker = getCharacter(shuffled[0] && shuffled[0].key);
        const listener = getCharacter(shuffled[1] && shuffled[1].key);
        if (!speaker || speaker.hidden) { return; }
        Stage.bubble(speaker.key, fallbackChatterLine(speaker, listener), 2200);
        if (listener && !listener.hidden) {
          requestApiChatter(speaker, listener, Director.phaseIndex, performance.now());
        }
        lastChatterAt = performance.now();
      }, 5200);
    }

    function update(directorPhase) {
      // Khi Director đang chạy kịch bản: KHÔNG để idle behavior kéo agent đi (hết loạn).
      // Chỉ wander/chatter ở trạng thái ambient (trước khi Bắt đầu hoặc sau khi xong).
      if (Director.isScripting()) { return; }
      const now = performance.now();
      maybeStartHuddle(now);
      getAllCharacters().forEach(function (ch) {
        const slot = register(ch.key);
        if (ch.hidden || ch.behaviorLock || ch.moveTarget || ch.path.length > 0) { return; }
        if (slot.holdUntil > now) { return; }
        if (slot.cooldown > now) { return; }
        const target = officeTargetFor(ch);
        sendToPoint(ch, target.point, target.zone, now);
      });
      tryOfficeChatter(now, directorPhase);
    }

    function tryOfficeChatter(now, directorPhase) {
      const socialWindow = activeHuddleUntil > now;
      const chance = socialWindow ? 0.22 : 0.09;
      if (now - lastChatterAt < 2600 || Math.random() > chance) { return; }
      const agents = getAllCharacters().filter(function (ch) {
        return !ch.hidden && !ch.behaviorLock && !ch.moveTarget && (!ch.path || ch.path.length === 0);
      });
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const a = agents[i];
          const b = agents[j];
          const close = Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);
          if (close <= 5) {
            a.facing = a.gx <= b.gx ? 'right' : 'left';
            b.facing = b.gx <= a.gx ? 'right' : 'left';
            if (chatterQueue.length) {
              const queued = chatterQueue.shift();
              Stage.bubble(queued.character || a.key, queued.text, 2100);
            } else {
              Stage.bubble(a.key, fallbackChatterLine(a, b), 1800);
              requestApiChatter(a, b, directorPhase, now);
            }
            lastChatterAt = now;
            return;
          }
        }
      }
    }

    function nudgeAllToOffice() {
      const now = performance.now();
      getAllCharacters().forEach(function (ch) {
        if (ch.behaviorLock) { return; }
        const target = officeTargetFor(ch);
        sendToPoint(ch, target.point, target.zone, now);
      });
    }

    function focusReview() {
      const now = performance.now();
      getAllCharacters().forEach(function (ch) {
        const target = reviewTargetFor(ch);
        sendToPoint(ch, target.point, target.zone, now);
      });
    }

    function reset() {
      lastChatterAt = 0;
      lastApiChatterAt = performance.now() - 20000;
      chatterWindowStart = performance.now();
      chatterRequestCount = 0;
      chatterPending = false;
      nextHuddleAt = performance.now() + 500;
      activeHuddleUntil = 0;
      chatterQueue.length = 0;
      Object.keys(slots).forEach(function (key) { delete slots[key]; });
      getAllCharacters().forEach(function (ch) {
        const slot = register(ch.key);
        slot.currentZone = 'desk';
        slot.holdUntil = performance.now() + 700 + Math.floor(Math.random() * 700);
        slot.cooldown = slot.holdUntil;
        const home = baseSeatFor(ch.key);
        slot.targetPoint = { x: home.x, y: home.y };
        slot.assignedPointKey = pointKey(home);
        slot.waitState = 'idle';
        ch.behaviorTask = null;
      });
    }

    function resumeAmbient() {
      const now = performance.now();
      nextHuddleAt = now + 200;
      activeHuddleUntil = 0;
      lastChatterAt = now - 3000;
      getAllCharacters().forEach(function (ch) {
        const slot = register(ch.key);
        ch.behaviorLock = false;
        slot.holdUntil = Math.min(slot.holdUntil || now, now + 250);
        slot.cooldown = Math.min(slot.cooldown || now, now + 250);
      });
    }

    return {
      update: update,
      reset: reset,
      resumeAmbient: resumeAmbient,
      focusReview: focusReview,
      nudgeAllToOffice: nudgeAllToOffice,
      getChatterRequestCount: function () { return chatterRequestCount; },
      MAX_CHATTER_REQUESTS_PER_WINDOW: MAX_CHATTER_REQUESTS_PER_WINDOW,
      CHATTER_WINDOW_MS: CHATTER_WINDOW_MS
    };
  })();

  // ---------------------------------------------------------------------------
  // Module Engine — game loop (nhân vật thêm ở Task 5)
  // ---------------------------------------------------------------------------
  const Engine = (function () {
    const entities = [];   // Task 5 sẽ thêm nhân vật
    let canvas = null;
    let ctx = null;
    let last = 0;
    let running = false;
    let rafId = 0;

    function update(dt) {
      Room.tick(dt);
      AgentBehavior.update(Director.phaseIndex);
      // Cập nhật entities (hiện rỗng)
      for (let i = 0; i < entities.length; i++) {
        if (entities[i] && typeof entities[i].update === 'function') {
          entities[i].update(dt);
        }
      }
      Director.update();
    }

    function render() {
      if (!ctx) { return; }
      // Áp scale supersampling rồi vẽ mọi thứ trong toạ độ logic.
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      Room.draw(ctx);
      // Vẽ entities theo depth y tăng dần (hiện chưa có)
      const ordered = entities.slice().sort(function (a, b) {
        return (a.depthY || 0) - (b.depthY || 0);
      });
      for (let i = 0; i < ordered.length; i++) {
        if (ordered[i] && typeof ordered[i].draw === 'function') {
          ordered[i].draw(ctx);
        }
      }
      // Bong bóng + tag hover (DOM overlay) bám theo vị trí nhân vật ở frame này.
      Stage.repositionOverlays();
    }

    function frame(ts) {
      if (!running) { return; }
      const dt = Math.min(50, ts - last);
      last = ts;
      update(dt);
      render();
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      canvas = document.getElementById('demoCanvas');
      if (!canvas) {
        console.error('Engine.start: không tìm thấy #demoCanvas');
        return;
      }
      ctx = canvas.getContext('2d');
      // Backing store = logic × scale (HTML giữ 640×352 cho aspect-ratio; JS override để nét).
      canvas.width = STAGE_W * RENDER_SCALE;
      canvas.height = STAGE_H * RENDER_SCALE;
      ctx.imageSmoothingEnabled = false;  // pixel sắc
      if (running) { return; }
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    return {
      entities: entities,
      start: start,
      stop: stop,
      getCharacter: getCharacter,
      get running() { return running; }
    };
  })();

  const Stage = (function () {
    const phaseButtons = [];
    let bubbleTimer = 0;
    let hoverKey = '';
    let activeBubble = null;   // { node, charKey } — bong bóng đang hiện, bám theo nhân vật mỗi frame

    function byId(id) {
      return document.getElementById(id);
    }

    function init() {
      const wrap = byId('demoPhases');
      if (wrap) {
        const list = wrap.querySelectorAll('.demo-phase');
        for (let i = 0; i < list.length; i++) {
          phaseButtons.push(list[i]);
        }
      }
      bindAgentHover();
      setMood('office');
      resetPanels();
    }

    function bindAgentHover() {
      const canvas = byId('demoCanvas');
      if (!canvas || canvas.__agentHoverBound) { return; }
      canvas.__agentHoverBound = true;
      canvas.addEventListener('mousemove', function (evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = STAGE_W / rect.width;
        const scaleY = STAGE_H / rect.height;
        const px = (evt.clientX - rect.left) * scaleX;
        const py = (evt.clientY - rect.top) * scaleY;
        const hit = findHoveredAgent(px, py);
        if (!hit) {
          clearHoverAgent();
          return;
        }
        renderHoverAgent(hit);
      });
      canvas.addEventListener('mouseleave', function () {
        clearHoverAgent();
      });
    }

    function findHoveredAgent(px, py) {
      const agents = getAllCharacters();
      for (let i = agents.length - 1; i >= 0; i--) {
        const ch = agents[i];
        if (ch.hidden) { continue; }
        const left = ch.gx * TILE - 4;
        const top = (ch.gy - 1) * TILE;
        const width = CHAR_FW + 8;
        const height = CHAR_FH;
        if (px >= left && px <= left + width && py >= top && py <= top + height) {
          return ch;
        }
      }
      return null;
    }

    function renderHoverAgent(ch) {
      hoverKey = ch.key;
      const meta = agentMetaFor(ch.key);
      const box = byId('demoAgentHover');
      if (box && meta) {
        box.innerHTML = '<strong>' + meta.name + '</strong><span>' + meta.role + ' · ' + describeAgentState(ch) + '</span>';
      }
      renderAgentTag(ch);
    }

    function renderAgentTag(ch) {
      const root = byId('demoBubbles');
      const meta = agentMetaFor(ch.key);
      if (!root || !meta) { return; }
      let node = byId('demoAgentTag');
      if (!node) {
        node = document.createElement('div');
        node.id = 'demoAgentTag';
        node.className = 'demo-agent-tag';
        root.appendChild(node);
      }
      node.innerHTML = '<strong>' + meta.name + '</strong><span>' + describeAgentState(ch) + '</span>';
      placeOverlay(node, ch, 10);
    }

    function clearHoverAgent() {
      hoverKey = '';
      const box = byId('demoAgentHover');
      if (box) {
        box.textContent = 'Trỏ vào agent để xem vai trò và trạng thái ngắn.';
      }
      const tag = byId('demoAgentTag');
      if (tag && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    }

    function setPhaseActive(index) {
      for (let i = 0; i < phaseButtons.length; i++) {
        phaseButtons[i].classList.toggle('is-active', Number(phaseButtons[i].dataset.phase) === index);
      }
      // Khung kết quả dạng tab: chỉ hiện panel khớp phase đang chọn.
      const panels = document.querySelectorAll('#demoResults [data-result-phase]');
      for (let j = 0; j < panels.length; j++) {
        panels[j].classList.toggle('is-shown', Number(panels[j].dataset.resultPhase) === index);
      }
    }

    function resetPanels() {
      const bubbleRoot = byId('demoBubbles');
      if (bubbleRoot) { bubbleRoot.innerHTML = ''; }
      activeBubble = null;

      const gauge = byId('resGauge');
      const risks = byId('resRisks');
      const checklist = byId('resChecklist');
      const lessons = byId('resLessons');

      if (gauge && risks && checklist && lessons) {
        renderStorySkeleton();
        renderSuggestedAdditions();
        renderRerunResult();
        bindOutcomeInput();
      } else {
        if (gauge) { gauge.innerHTML = '<div class="demo-card-title">Mức sẵn sàng</div><div class="demo-muted">Chờ Launch Readiness Agent chấm điểm.</div>'; }
        if (risks) { risks.innerHTML = '<div class="demo-card-title">Thẻ rủi ro</div><div class="demo-muted">Red Team sẽ lật từng thẻ ở chặng phản biện.</div>'; }
        if (checklist) { checklist.innerHTML = '<div class="demo-card-title">Việc cần làm</div><div class="demo-muted">Checklist sẽ hiện ra sau khi rủi ro được xác nhận.</div>'; }
        if (lessons) { lessons.innerHTML = '<div class="demo-card-title">Bài học</div><div class="demo-muted">Post-mortem Agent sẽ chốt lại bài học cuối cùng.</div>'; }
      }

      renderReasoningPanel(buildReasoningItems({
        runData: getActiveRunData(),
        source: 'idle',
        statusLabel: 'Sẵn sàng demo'
      }), {
        tone: 'idle',
        statusText: 'Các bước suy luận đã sẵn sàng',
        fallbackText: 'Bấm Phân Tích AI để xem agent đọc brief, dò thiếu sót, soi rủi ro và chốt quyết định.'
      });
    }

    function renderRunMeta() {
      const badge = byId('demoRunBadge');
      if (!badge) { return; }
      const runLabel = DemoData.activeRunKey === 'run2' ? 'Lượt 2' : 'Lượt 1';
      badge.textContent = runLabel + ' · ' + (DemoData.briefLabel || 'Brief mẫu');
    }

    function setMood(mood) {
      const app = document.querySelector('.demo-app');
      if (!app) { return; }
      const nextMood = mood === 'review' ? 'review' : 'office';
      const moodChip = byId('demoMood');
      app.dataset.mood = nextMood;
      Room.setMood(nextMood);
      if (moodChip) {
        moodChip.textContent = nextMood === 'review' ? 'Ph\u00f2ng h\u1ecdp ph\u1ea3n bi\u1ec7n' : 'V\u0103n ph\u00f2ng l\u00e0m vi\u1ec7c';
        moodChip.classList.toggle('demo-chip-review', nextMood === 'review');
        moodChip.classList.toggle('demo-chip-office', nextMood !== 'review');
      }
    }

    function clearPersonaLinks() {
      PERSONA_LINKS.length = 0;
      const stage = document.querySelector('.demo-stage');
      if (!stage) { return; }
      const old = document.getElementById('demoPersonaLinks');
      if (old && old.parentNode) { old.parentNode.removeChild(old); }
    }

    function renderPersonaLinks() {
      const stage = document.querySelector('.demo-stage');
      const canvas = byId('demoCanvas');
      const rootAgent = getCharacter('red_team');
      if (!stage || !canvas || !rootAgent) { return; }
      let svg = document.getElementById('demoPersonaLinks');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'demoPersonaLinks');
        svg.setAttribute('class', 'demo-persona-links');
        stage.appendChild(svg);
      }
      svg.setAttribute('viewBox', '0 0 ' + STAGE_W + ' ' + STAGE_H);
      svg.innerHTML = '';
      const leaderPoint = getPersonaScreenPoint(rootAgent);
      PERSONA_LINKS.forEach(function (entry) {
        const persona = PersonaCharacters[entry.key];
        if (!persona || persona.hidden) { return; }
        const point = getPersonaScreenPoint(persona);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(leaderPoint.x));
        line.setAttribute('y1', String(leaderPoint.y));
        line.setAttribute('x2', String(point.x));
        line.setAttribute('y2', String(point.y));
        line.setAttribute('class', 'demo-persona-link' + (entry.active ? ' is-active' : ''));
        svg.appendChild(line);
      });
    }

    function setPersonaLink(key, active) {
      const existing = PERSONA_LINKS.find(function (item) { return item.key === key; });
      if (existing) {
        existing.active = !!active;
      } else {
        PERSONA_LINKS.push({ key: key, active: !!active });
      }
      renderPersonaLinks();
    }

    // Đặt 1 overlay (bong bóng / tag) ngay trên đầu nhân vật.
    // QUAN TRỌNG: cộng canvas.offsetLeft/offsetTop để bù phần letterbox khi canvas
    // bị căn giữa trong .demo-stage (nếu không sẽ lệch trái, càng rộng càng lệch).
    function placeOverlay(node, ch, gap) {
      const canvas = byId('demoCanvas');
      if (!node || !canvas || !ch) { return; }
      const scaleX = canvas.clientWidth / STAGE_W;
      const scaleY = canvas.clientHeight / STAGE_H;
      const headX = canvas.offsetLeft + (ch.gx * TILE + CHAR_FW / 2) * scaleX;
      const headY = canvas.offsetTop + ((ch.gy - 1) * TILE - gap) * scaleY;
      const minX = canvas.offsetLeft + 58;
      const maxX = canvas.offsetLeft + Math.max(58, canvas.clientWidth - 58);
      const minY = canvas.offsetTop + 22;
      node.style.left = clamp(headX, minX, maxX) + 'px';
      node.style.top = Math.max(minY, headY) + 'px';
    }

    function bubble(charKey, text, ms) {
      const root = byId('demoBubbles');
      const ch = getCharacter(charKey);
      if (!root || !ch) { return; }
      // Xoá đúng bong bóng cũ (không wipe cả root để giữ lại tag hover).
      if (activeBubble && activeBubble.node && activeBubble.node.parentNode) {
        activeBubble.node.parentNode.removeChild(activeBubble.node);
      }
      const node = document.createElement('div');
      node.className = 'demo-bubble';
      node.textContent = text;
      root.appendChild(node);
      activeBubble = { node: node, charKey: charKey };
      placeOverlay(node, ch, 6);
      if (bubbleTimer) { clearTimeout(bubbleTimer); }
      bubbleTimer = window.setTimeout(function () {
        if (node.parentNode) { node.parentNode.removeChild(node); }
        if (activeBubble && activeBubble.node === node) { activeBubble = null; }
      }, ms || 2200);
    }

    // Gọi mỗi frame (từ Engine.render): bong bóng + tag hover bám theo nhân vật,
    // kể cả khi nhân vật đang di chuyển. Ẩn nếu nhân vật đang hidden.
    function repositionOverlays() {
      if (activeBubble && activeBubble.node && activeBubble.node.parentNode) {
        const ch = getCharacter(activeBubble.charKey);
        if (ch && !ch.hidden) {
          activeBubble.node.style.display = '';
          placeOverlay(activeBubble.node, ch, 6);
        } else {
          activeBubble.node.style.display = 'none';
        }
      }
      if (hoverKey) {
        const tag = byId('demoAgentTag');
        const ch = getCharacter(hoverKey);
        if (tag && ch && !ch.hidden) { placeOverlay(tag, ch, 10); }
      }
    }

    function revealGauge(score, max, color) {
      const el = byId('resGauge');
      if (!el) { return; }
      renderRunMeta();
      const hue = color === 'warning' ? '#e0a400' : (color === 'success' ? '#0c7a48' : '#b3261e');
      const dash = Math.round((score / max) * 283);
      const runData = getActiveRunData();
      const stepMeta = getStoryStepMeta(DemoData.activeRunKey === 'run2' ? 'run2' : 'run1');
      const run1Data = DemoData.run1 || {};
      const run2Data = DemoData.run2 || {};
      const isRun2 = DemoData.activeRunKey === 'run2';
      const compareBlock = '<div class="demo-gauge-compare">' +
        '<span class="demo-compare-chip ' + (isRun2 ? 'is-done' : 'is-active') + '">Lượt 1 · ' + (run1Data.score || 0) + '/' + (run1Data.maxScore || 12) + ' ' + escapeHtml(run1Data.readinessLabel || '') + '</span>' +
        '<span class="demo-compare-arrow" aria-hidden="true">&#8594;</span>' +
        (isRun2
          ? '<span class="demo-compare-chip is-active">Lượt 2 · ' + (run2Data.score || 0) + '/' + (run2Data.maxScore || 12) + ' ' + escapeHtml(run2Data.readinessLabel || '') + '</span>'
          : '<span class="demo-compare-chip is-pending">Lượt 2 · sau khi bổ sung brief</span>') +
      '</div>';
      el.innerHTML = '<div class="demo-card-title">Chấm điểm sẵn sàng</div>' +
        '<div class="demo-story-section demo-story-readiness">' +
          '<div class="demo-story-head">' +
            '<span class="demo-story-chip ' + stepMeta.state + '">' + stepMeta.label + '</span>' +
            '<div class="demo-story-copy"><strong>' + stepMeta.title + '</strong><span>' + stepMeta.summary + '</span></div>' +
          '</div>' +
          '<div class="demo-gauge-box">' +
            '<svg width="118" height="118" viewBox="0 0 120 120" aria-hidden="true">' +
              '<circle cx="60" cy="60" r="45" fill="none" stroke="#f0ece5" stroke-width="10"></circle>' +
              '<circle cx="60" cy="60" r="45" fill="none" stroke="' + hue + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + dash + ' 283" transform="rotate(-90 60 60)"></circle>' +
            '</svg>' +
            '<div class="demo-gauge-score"><strong>' + score + '/' + max + '</strong><span>' + runData.readinessLabel + '</span></div>' +
          '</div>' +
          compareBlock +
          '<div class="demo-card-copy">' + runData.summary + '</div>' +
        '</div>';
    }

    function revealRisk(card) {
      if (!card) { return; }
      const el = byId('resRisks');
      if (!el) { return; }
      let list = el.querySelector('.demo-list-risks');
      if (!list) {
        renderStorySkeleton();
        renderSuggestedAdditions();
        renderRerunResult();
        list = el.querySelector('.demo-list-risks');
      }
      const node = document.createElement('div');
      node.className = 'demo-risk-card';
      node.innerHTML = '<strong>' + card.title + '</strong><span>' + card.note + '</span><em>Owner: ' + card.owner + '</em>';
      list.appendChild(node);
    }

    function revealChecklist(item) {
      const el = byId('resChecklist');
      if (!el) { return; }
      let list = el.querySelector('.demo-list-checklist');
      if (!list) {
        renderStorySkeleton();
        renderSuggestedAdditions();
        renderRerunResult();
        bindOutcomeInput();
        list = el.querySelector('.demo-list-checklist');
      }
      const node = document.createElement('div');
      node.className = 'demo-check-item';
      node.innerHTML = '<strong>' + item.task + '</strong><span>' + item.owner + ' · ' + item.deadline + '</span><em>' + item.status + '</em>';
      list.appendChild(node);
    }

    function revealLessons(items) {
      const el = byId('resLessons');
      if (!el) { return; }
      const lessonItems = (items && items.length ? items.slice() : (DemoData.derivedLessons || []).slice());
      if (DemoData.memoryLesson) {
        lessonItems.push('Memory lesson: ' + DemoData.memoryLesson);
      }
      const memoryMeta = getStoryStepMeta('memory');
      el.innerHTML = '<div class="demo-card-title">Bài học + Lượt 2</div>' +
        '<div class="demo-story-section demo-story-lessons">' +
          '<div class="demo-story-head">' +
            '<span class="demo-story-chip ' + memoryMeta.state + '">' + memoryMeta.label + '</span>' +
            '<div class="demo-story-copy"><strong>' + memoryMeta.title + '</strong><span>' + memoryMeta.summary + '</span></div>' +
          '</div>' +
          '<div class="demo-story-subtitle">Bài học rút ra</div>' +
          '<div class="demo-list demo-list-lessons">' + lessonItems.map(function (item) {
            return '<div class="demo-lesson-item">' + escapeHtml(item) + '</div>';
          }).join('') + '</div>' +
          '<div class="demo-memory-line">' + escapeHtml(getOutcomeMemoryLine()) + '</div>' +
          '<div class="demo-story-divider"></div>' +
          '<div class="demo-story-subtitle">Kết quả lượt 2</div>' +
          '<div class="demo-rerun-box"></div>' +
        '</div>';
      renderRerunResult();
    }

    return {
      init: init,
      bubble: bubble,
      repositionOverlays: repositionOverlays,
      revealGauge: revealGauge,
      revealRisk: revealRisk,
      revealChecklist: revealChecklist,
      revealLessons: revealLessons,
      setPhaseActive: setPhaseActive,
      resetPanels: resetPanels,
      renderRunMeta: renderRunMeta,
      setMood: setMood,
      clearPersonaLinks: clearPersonaLinks,
      setPersonaLink: setPersonaLink,
      renderPersonaLinks: renderPersonaLinks
    };
  })();

  const Director = (function () {
    let phaseIndex = 0;
    let started = false;
    let complete = false;
    let phaseStart = 0;
    let phaseEvents = [];
    let eventCursor = 0;
    let phaseEndAt = 0;
    const KEEP_PERSONAS = true;
    let redTeamTimers = [];   // timeout id của kịch bản phỏng vấn (arrival-driven)
    let redTeamDone = false;
    let returningHome = false;

    function clearRedTeamTimers() {
      redTeamTimers.forEach(function (t) { window.clearTimeout(t); });
      redTeamTimers = [];
    }

    function resetCharacters() {
      clearRedTeamTimers();
      redTeamDone = false;
      returningHome = false;
      getAllCharacters().forEach(function (ch) {
        ch.gx = Math.round(ch.gx);
        ch.gy = Math.round(ch.gy);
        ch.path = [];
        ch.moveTarget = null;
        ch.onArrive = null;
        ch.behaviorLock = false;
        ch.behaviorTask = null;
        ch.setState('idle');
      });
      ensurePersonas();
      DemoData.personas.forEach(function (persona) {
        const ch = PersonaCharacters[persona.key];
        ch.hidden = true;
        ch.gx = persona.spawn.x;
        ch.gy = persona.spawn.y;
        ch.path = [];
        ch.moveTarget = null;
        ch.onArrive = null;
        ch.facing = persona.facing;
        ch.setState('idle');
      });
      Stage.clearPersonaLinks();
      Stage.setMood('office');
      AgentBehavior.reset();
    }

    function beginPhaseZeroAfterHomecoming() {
      if (!started || complete || !returningHome) { return; }
      returningHome = false;
      getAllCharacters().forEach(function (ch) {
        const desk = deskForAgent(ch.key);
        if (!desk) { return; }
        ch.behaviorLock = true;
        ch.facing = desk.facing;
        ch.setState('idle');
      });
      gotoPhase(0);
      const startBtn = document.getElementById('demoStart');
      if (startBtn) { startBtn.textContent = 'Đang chạy...'; }
    }

    function returnAgentsToDesksThenStart() {
      returningHome = true;
      phaseIndex = 0;
      phaseEvents = [];
      eventCursor = 0;
      phaseEndAt = Infinity;
      Stage.setPhaseActive(0);
      Stage.setMood('office');
      Stage.bubble('assistant', 'Mọi người về bàn làm việc trước, rồi mình bắt đầu flow LaunchOps.', 2400);

      const agents = getAllCharacters().filter(function (ch) { return !!deskForAgent(ch.key); });
      let pending = agents.length;
      let finished = false;
      function oneArrived(ch) {
        const desk = deskForAgent(ch.key);
        if (desk) {
          ch.gx = desk.seat.x;
          ch.gy = desk.seat.y;
          ch.facing = desk.facing;
        }
        ch.path = [];
        ch.moveTarget = null;
        ch.onArrive = null;
        ch.behaviorLock = true;
        ch.setState('idle');
        pending -= 1;
        if (pending <= 0 && !finished) {
          finished = true;
          window.setTimeout(beginPhaseZeroAfterHomecoming, 500);
        }
      }

      agents.forEach(function (ch) {
        const desk = deskForAgent(ch.key);
        if (!desk) { return; }
        ch.behaviorLock = true;
        ch.behaviorTask = null;
        ch.path = [];
        ch.moveTarget = null;
        ch.onArrive = null;
        const sx = Math.round(ch.gx);
        const sy = Math.round(ch.gy);
        ch.gx = sx;
        ch.gy = sy;
        if (sx === desk.seat.x && sy === desk.seat.y) {
          oneArrived(ch);
          return;
        }
        const moved = ch.walkTo(desk.seat.x, desk.seat.y, oneArrived);
        if (!moved) {
          oneArrived(ch);
        }
      });
      if (pending <= 0 && !finished) {
        finished = true;
        window.setTimeout(beginPhaseZeroAfterHomecoming, 500);
      }
      window.setTimeout(function () {
        if (returningHome && !finished) {
          finished = true;
          beginPhaseZeroAfterHomecoming();
        }
      }, 9000);
    }

    function start() {
      applyStoryMode(resolveBriefMode());
      collectOutcomeInput();
      started = true;
      complete = false;
      Stage.resetPanels();
      Stage.renderRunMeta();
      resetCharacters();
      returningHome = true;
      returnAgentsToDesksThenStart();
      const startBtn = document.getElementById('demoStart');
      if (startBtn) { startBtn.textContent = 'Đang về bàn...'; }
    }

    function gotoPhase(index) {
      phaseIndex = Math.max(0, Math.min(index, DemoData.phases.length - 1));
      phaseStart = performance.now();
      eventCursor = 0;
      clearRedTeamTimers();            // rời/đổi phase -> huỷ timer phỏng vấn đang chờ
      Stage.setPhaseActive(phaseIndex);
      if (phaseIndex === 2) {
        // Phase Red Team: chỉ Nick lên họp; persona đi từ CỬA RA VÀO vào ghế (arrival-driven).
        Stage.setMood('review');
        AgentBehavior.focusReview();
        phaseEvents = [];
        redTeamDone = false;
        phaseEndAt = Infinity;         // sequencer tự set phaseEndAt khi phỏng vấn xong
        startRedTeamInterview();
        return;
      }
      Stage.setMood('office');
      phaseEvents = DemoData.phases[phaseIndex].actions.slice();
      // Thời lượng phase = đủ chứa toàn bộ event (đối thoại) và hold cuối.
      let dur = 5000;
      phaseEvents.forEach(function (e) {
        if (e.type === 'hold') { dur = Math.max(dur, e.ms || 0); }
        else { dur = Math.max(dur, e.at + (e.ms || 0) + 600); }
      });
      phaseEndAt = phaseStart + dur;
    }

    // Kịch bản phỏng vấn Red Team — ARRIVAL-DRIVEN (bám animation, không theo mốc thời gian cứng):
    // 5 persona vào lần lượt từ cửa -> ngồi -> lần lượt phát biểu + lộ risk -> Nick chốt -> tất cả đi ra cửa.
    function startRedTeamInterview() {
      ensurePersonas();
      Stage.clearPersonaLinks();
      const personas = DemoData.personas;
      let finished = false;

      function finishRedTeam() {
        if (finished) { return; }
        finished = true;
        redTeamDone = true;
        phaseEndAt = performance.now();   // cho update() chuyển sang phase kế
      }

      Stage.bubble('red_team', 'Tôi mời hội đồng phản biện vào phòng họp. Mời mọi người vào ghế.', 3200);

      // (1) 10 persona vào SONG SONG nhưng lệch nhịp (xếp hàng từ cửa), mỗi người cách ~0.7s.
      const STAGGER = 700;
      personas.forEach(function (p, idx) {
        redTeamTimers.push(window.setTimeout(function () {
          const ch = PersonaCharacters[p.key];
          if (!ch) { return; }
          ch.hidden = false;
          ch.behaviorLock = true;
          Stage.setPersonaLink(p.key, false);
          const seatArrive = function (self) {
            self.facing = p.facing || 'up';
            self.setState('read');
            Stage.renderPersonaLinks();
          };
          const moved = ch.walkTo(p.seat.x, p.seat.y, seatArrive);
          if (!moved) { ch.gx = p.seat.x; ch.gy = p.seat.y; seatArrive(ch); }
        }, idx * STAGGER));
      });
      // Sau khi cả nhóm gần như vào ghế thì bắt đầu phát biểu lần lượt.
      const entryWindow = personas.length * STAGGER + 6500;
      redTeamTimers.push(window.setTimeout(function () { speakSeq(0); }, entryWindow));

      // (2) Chỉ các persona có bubble + riskIndex phát biểu chính (5 người hàng dưới);
      // các persona còn lại ngồi nghe để phòng họp đông đủ.
      const speakers = personas.filter(function (p) { return p.bubble && typeof p.riskIndex === 'number'; });
      function speakSeq(i) {
        if (i >= speakers.length) { wrapUp(); return; }
        const p = speakers[i];
        const ch = PersonaCharacters[p.key];
        if (ch) {
          ch.behaviorLock = true;
          if (ch.moveTarget) { ch.path = []; ch.moveTarget = null; ch.gx = p.seat.x; ch.gy = p.seat.y; }
          ch.facing = p.facing || 'up';
          ch.setState('alert');
          Stage.setPersonaLink(p.key, true);
          Stage.bubble(p.key, p.bubble, 3000);
          Stage.revealRisk(getActiveRunData().risks[p.riskIndex]);
        }
        redTeamTimers.push(window.setTimeout(function () {
          if (ch) { ch.setState('read'); Stage.setPersonaLink(p.key, false); }
          speakSeq(i + 1);
        }, 3000));
      }

      function wrapUp() {
        Stage.bubble('red_team', 'Đủ góc nhìn từ hội đồng. Rocky, tôi chuyển các thẻ rủi ro sang checklist để khóa việc ngay.', 3200);
        redTeamTimers.push(window.setTimeout(exitAll, 2800));
      }

      // (3) Tất cả persona đi RA cửa rồi ẩn -> phòng họp trống cho các phase sau.
      function exitAll() {
        const ex = Room.ENTRANCE;
        const exitTiles = [
          { x: ex.doorX + 2, y: ex.y0 }, { x: ex.doorX + 2, y: ex.y1 },
          { x: ex.doorX + 1, y: ex.y0 }, { x: ex.doorX + 1, y: ex.y1 },
          { x: ex.doorX, y: ex.y1 }
        ];
        Stage.clearPersonaLinks();
        let remaining = personas.length;
        const dec = function () { remaining -= 1; if (remaining <= 0) { finishRedTeam(); } };
        personas.forEach(function (p, idx) {
          const ch = PersonaCharacters[p.key];
          if (!ch) { dec(); return; }
          ch.behaviorLock = true;
          const t = exitTiles[idx % exitTiles.length];
          const moved = ch.walkTo(t.x, t.y, function (self) { self.hidden = true; dec(); });
          if (!moved) { ch.hidden = true; dec(); }
        });
        redTeamTimers.push(window.setTimeout(finishRedTeam, 10000));  // an toàn nếu walk lỗi
      }
    }

    function runEvent(evt) {
      switch (evt.type) {
        case 'bubble':
          Stage.bubble(evt.character, choose(evt.textOptions) || evt.text, evt.ms || 2400);
          break;
        case 'state': {
          const ch = getCharacter(evt.character);
          if (ch) {
            ch.behaviorLock = true;
            ch.setState(evt.state);
          }
          break;
        }
        case 'walk': {
          const walker = getCharacter(evt.character);
          if (walker && evt.to) {
            walker.behaviorLock = true;
            const moved = walker.walkTo(evt.to.x, evt.to.y, function (self) {
              self.facing = evt.to.facing || self.facing;
              self.setState(evt.to.state || 'idle');
            });
            if (!moved) {
              walker.gx = evt.to.x;
              walker.gy = evt.to.y;
              walker.facing = evt.to.facing || walker.facing;
              walker.setState(evt.to.state || 'idle');
            }
          }
          break;
        }
        case 'gauge':
          Stage.revealGauge(getActiveRunData().score, getActiveRunData().maxScore, getActiveRunData().readinessColor);
          break;
        case 'checklist':
          getActiveRunData().checklist.forEach(function (item) { Stage.revealChecklist(item); });
          break;
        case 'lessons':
          Stage.revealLessons(DemoData.derivedLessons);
          break;
        case 'cheer-all':
          getAllCharacters().forEach(function (ch) {
            ch.behaviorLock = true;
            ch.setState('cheer');
          });
          break;
        case 'persona-show': {
          const personaShow = PersonaCharacters[evt.key];
          if (personaShow) {
            personaShow.hidden = false;
            personaShow.behaviorLock = true;
            Stage.setPersonaLink(evt.key, false);
          }
          break;
        }
        case 'persona-walk': {
          const personaWalk = PersonaCharacters[evt.key];
          if (personaWalk) {
            personaWalk.behaviorLock = true;
            const canWalk = personaWalk.walkTo(evt.to.x, evt.to.y, function (self) {
              self.facing = (self.gx >= Room.MEETING.tableTiles[0].x + 1) ? 'left' : 'right';
              self.setState('idle');
              Stage.renderPersonaLinks();
            });
            if (!canWalk) {
              personaWalk.gx = evt.to.x;
              personaWalk.gy = evt.to.y;
              personaWalk.facing = (personaWalk.gx >= Room.MEETING.tableTiles[0].x + 1) ? 'left' : 'right';
              personaWalk.setState('idle');
              Stage.renderPersonaLinks();
            }
          }
          break;
        }
        case 'persona-seat': {
          const personaSeat = PersonaCharacters[evt.key];
          if (personaSeat) {
            personaSeat.behaviorLock = true;
            personaSeat.facing = (personaSeat.gx >= Room.MEETING.tableTiles[0].x + 1) ? 'left' : 'right';
            personaSeat.setState('read');
            Stage.renderPersonaLinks();
          }
          break;
        }
        case 'persona-alert': {
          const personaAlert = PersonaCharacters[evt.key];
          if (personaAlert) {
            personaAlert.behaviorLock = true;
            personaAlert.setState('alert');
            Stage.setPersonaLink(evt.key, true);
          }
          Stage.bubble(evt.key, evt.text, 2600);
          Stage.revealRisk(getActiveRunData().risks[evt.riskIndex]);
          break;
        }
        case 'persona-settle': {
          const personaSettle = PersonaCharacters[evt.key];
          if (personaSettle) {
            personaSettle.behaviorLock = true;
            personaSettle.setState('read');
            Stage.setPersonaLink(evt.key, false);
          }
          break;
        }
        case 'persona-exit': {
          const personaExit = PersonaCharacters[evt.key];
          if (personaExit) {
            Stage.setPersonaLink(evt.key, false);
            personaExit.walkTo(evt.to.x, evt.to.y, function (self) {
              self.setState('idle');
              self.behaviorLock = false;
              if (!KEEP_PERSONAS) { self.hidden = true; }
              Stage.renderPersonaLinks();
            });
          }
          break;
        }
        case 'persona-links-reset':
          Stage.clearPersonaLinks();
          break;
        case 'personas-freeze':
          DemoData.personas.forEach(function (persona) {
            const personaFreeze = PersonaCharacters[persona.key];
            if (personaFreeze && !personaFreeze.hidden) {
              personaFreeze.behaviorLock = true;
              personaFreeze.setState('idle');
            }
          });
          Stage.renderPersonaLinks();
          break;
        case 'hold':
          window.setTimeout(function () {
            getAllCharacters().forEach(function (ch) {
              ch.behaviorLock = false;
            });
            DemoData.personas.forEach(function (persona) {
              const personaHold = PersonaCharacters[persona.key];
              if (personaHold && KEEP_PERSONAS && !personaHold.hidden) {
                personaHold.behaviorLock = true;
              }
            });
          }, 800);
          phaseEndAt = phaseStart + evt.ms;
          break;
        default:
          break;
      }
    }

    function update() {
      if (!started || complete) { return; }
      const elapsed = performance.now() - phaseStart;
      while (eventCursor < phaseEvents.length && elapsed >= phaseEvents[eventCursor].at) {
        runEvent(phaseEvents[eventCursor]);
        eventCursor += 1;
      }
      if (elapsed >= (phaseEndAt - phaseStart)) {
        if (phaseIndex >= DemoData.phases.length - 1) {
          if (DemoData.activeRunKey === 'run1') {
            collectOutcomeInput();
            if (DemoData.selectedMode === 'real') {
              DemoData.storyModes.real = deriveRealStoryFromInput(DemoData.shortBrief, DemoData.storyModes.real);
              applyStoryMode('real');
            } else {
              applyStoryMode('sample');
            }
            DemoData.activeRunKey = 'run2';
            DemoData.score = DemoData.run2.score;
            DemoData.maxScore = DemoData.run2.maxScore;
            DemoData.readinessLabel = DemoData.run2.readinessLabel;
            DemoData.readinessColor = DemoData.run2.readinessColor;
            DemoData.summary = DemoData.run2.summary;
            DemoData.risks = cloneData(DemoData.run2.risks || []);
            DemoData.checklist = cloneData(DemoData.run2.checklist || []);
            DemoData.lessons = cloneData(DemoData.derivedLessons || []);
            Stage.resetPanels();
            Stage.renderRunMeta();
            resetCharacters();
            returnAgentsToDesksThenStart();
          } else {
            complete = true;
            // Mở khoá để idle behavior (wander + chatter) chạy lại ở trạng thái ambient.
            getAllCharacters().forEach(function (ch) { ch.behaviorLock = false; ch.setState('idle'); });
            AgentBehavior.resumeAmbient();
            const startBtn = document.getElementById('demoStart');
            if (startBtn) { startBtn.textContent = 'Chạy lại'; }
          }
        } else {
          gotoPhase(phaseIndex + 1);
        }
      }
    }

    return {
      start: start,
      gotoPhase: gotoPhase,
      update: update,
      get phaseIndex() { return phaseIndex; },
      get started() { return started; },
      get complete() { return complete; },
      isScripting: function () { return started && !complete; }
    };
  })();

  // ---------------------------------------------------------------------------
  // Boot tối thiểu — nạp asset cốt lõi, verify hoạt động
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    // Tập hợp asset cần nạp để verify lớp asset hoạt động
    const bootMap = {};

    // 6 character sprite sheet
    CHARACTER_SHEETS.forEach(function (url, i) {
      bootMap['char_' + i] = url;
    });

    // 3 floor tile đầu tiên (đủ để kiểm tra)
    FLOOR_TILES.slice(0, 3).forEach(function (url, i) {
      bootMap['floor_' + i] = url;
    });

    // Wall sheet
    bootMap['wall_0'] = WALL_SHEET;

    // Toàn bộ 9 floor tile (preload đủ cho Room.draw)
    FLOOR_TILES.forEach(function (url, i) {
      if (bootMap['floor_' + i]) { return; }
      bootMap['floor_' + i] = url;
    });

    // Furniture dùng trong Room — nạp theo từng member id cụ thể.
    // Mỗi entry: { group, ids } — chỉ nạp các member id cần thiết.
    const furnitureNeeded = [
      { group: 'DESK', ids: ['DESK_FRONT'] },
      { group: 'PC', ids: ['PC_FRONT_ON_1'] },
      { group: 'WOODEN_CHAIR', ids: ['WOODEN_CHAIR_BACK'] },
      { group: 'CUSHIONED_CHAIR', ids: ['CUSHIONED_CHAIR_FRONT', 'CUSHIONED_CHAIR_BACK', 'CUSHIONED_CHAIR_SIDE'] },
      { group: 'WHITEBOARD', ids: ['WHITEBOARD'] },
      { group: 'COFFEE_TABLE', ids: ['COFFEE_TABLE'] },
      { group: 'PLANT', ids: ['PLANT'] },
      { group: 'LARGE_PLANT', ids: ['LARGE_PLANT'] },
      { group: 'SOFA', ids: ['SOFA_FRONT', 'SOFA_BACK', 'SOFA_SIDE'] },
      { group: 'BIN', ids: ['BIN'] },
      { group: 'SMALL_PAINTING', ids: ['SMALL_PAINTING'] },
      { group: 'LARGE_PAINTING', ids: ['LARGE_PAINTING'] },
      { group: 'COFFEE', ids: ['COFFEE'] }
    ];
    furnitureNeeded.forEach(function (req) {
      const group = FURNITURE[req.group];
      if (!group || !group.members) { return; }
      req.ids.forEach(function (id) {
        const m = group.members.find(function (mm) { return mm.id === id; });
        if (m) { bootMap['furn_' + m.id] = m.file; }
      });
    });

    Assets.load(bootMap)
      .then(function () {
        console.log('demo assets ready');
        buildCharacters();   // tạo 6 agent + push vào Engine.entities
        ensurePersonas();
        Stage.init();
        bindControls();
        Engine.start();
        AgentBehavior.resumeAmbient();
      })
      .catch(function (err) {
        console.error('demo assets error:', err.message);
      });
  });

  function bindControls() {
    const startBtn = document.getElementById('demoStart');
    const exitLink = document.getElementById('demoExit');
    const phaseBtns = document.querySelectorAll('.demo-phase');
    const sampleButton = document.getElementById('demoBriefSample');
    const realOption = document.getElementById('demoBriefRealOption');
    const realInput = document.getElementById('demoBriefReal');

    if (startBtn && !startBtn.__demoBound) {
      startBtn.__demoBound = true;
      startBtn.addEventListener('click', function () {
        if (resolveBriefMode() === 'real') {
          // Brief thật -> đồng bộ brief người dùng nhập rồi gọi LLM thật (office giữ ở ambient).
          applyStoryMode('real');
          runLlmAnalyze(startBtn);
        } else {
          // Brief mẫu -> chạy flow fallback dựng sẵn, KHÔNG gọi LLM.
          Director.start();
        }
      });
    }

    if (sampleButton && !sampleButton.__demoBound) {
      sampleButton.__demoBound = true;
      sampleButton.addEventListener('click', function () {
        syncBriefModeUI('sample');
      });
    }

    if (realOption && !realOption.__demoBound) {
      realOption.__demoBound = true;
      realOption.addEventListener('click', function () {
        syncBriefModeUI('real');
        if (realInput) { realInput.focus(); }
      });
    }

    if (realInput && !realInput.__demoBound) {
      realInput.__demoBound = true;
      realInput.addEventListener('focus', function () {
        if (!realInput.readOnly) { syncBriefModeUI('real'); }
      });
      realInput.addEventListener('input', function () {
        syncBriefModeUI('real');
      });
    }

    for (let i = 0; i < phaseBtns.length; i++) {
      if (phaseBtns[i].__demoBound) { continue; }
      phaseBtns[i].__demoBound = true;
      phaseBtns[i].addEventListener('click', function () {
        // Tab thuần chuyển khung kết quả; flow chạy/animation do nút "Phân Tích AI" điều khiển.
        Stage.setPhaseActive(Number(this.dataset.phase || '0'));
      });
    }

    if (exitLink && !exitLink.__demoBound) {
      exitLink.__demoBound = true;
      exitLink.addEventListener('click', function (evt) {
        evt.preventDefault();
        window.location.href = '/';
      });
    }

    syncBriefModeUI('sample');
    Stage.setPhaseActive(0);
  }

  function resolveBriefMode() {
    const realOption = document.getElementById('demoBriefRealOption');
    const realInput = document.getElementById('demoBriefReal');
    const isReal = realOption && realOption.classList.contains('is-active');
    if (isReal && realInput) {
      const customBrief = normalizeText(realInput.value);
      if (customBrief) {
        DemoData.storyModes.real = deriveRealStoryFromInput(customBrief, DemoData.storyModes.real);
      }
      return 'real';
    }
    return 'sample';
  }

  function runLlmAnalyze(button) {
    const resGauge = document.getElementById('resGauge');
    if (!resGauge) { return; }
    const fallbackRun = getActiveRunData();
    if (button) {
      button.disabled = true;
      button.textContent = 'Đang phân tích...';
    }
    renderReasoningPanel(buildReasoningItems({
      runData: fallbackRun,
      source: 'progress',
      statusLabel: 'Đang đọc brief và gom tín hiệu'
    }), {
      tone: 'loading',
      statusText: 'Đang chạy Phân Tích AI',
      fallbackText: 'Chỉ hiển thị các bước mức cao: đọc brief, dò thiếu sót, soi rủi ro, đề xuất bổ sung và chốt quyết định.'
    });
    resGauge.innerHTML = '<div class="demo-card-title">Phân tích AI</div><div class="demo-muted">Đang gọi agent thật, có thể mất 1-2 phút.</div>';
    Stage.setPhaseActive(0);
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: DemoData.shortBrief || fallbackRun.summary || 'Launch brief demo',
        launch: {
          id: DemoData.launchId,
          name: DemoData.title,
          type: 'game_event_h5',
          status: 'upcoming',
          owner: 'LaunchOps demo',
          brief: DemoData.shortBrief || fallbackRun.summary || ''
        }
      })
    })
      .then(function (resp) {
        return resp.json().then(function (data) {
          return { ok: resp.ok, data: data };
        });
      })
      .then(function (payload) {
        if (!payload.ok) {
          throw new Error('bad_status');
        }
        const result = payload.data && payload.data.result ? payload.data.result : payload.data;
        const readiness = result && result.readiness ? result.readiness : {};
        const score = typeof readiness.score === 'number' ? readiness.score : fallbackRun.score;
        const max = typeof readiness.maxScore === 'number' ? readiness.maxScore : fallbackRun.maxScore;
        const color = normalizeReadinessColor(readiness.color, fallbackRun.readinessColor);
        const summary = String((result && (result.summary || result.analysis)) || fallbackRun.summary || '').trim() || fallbackRun.summary;
        const apiRisks = Array.isArray(result && result.risks) ? result.risks.filter(Boolean).map(function (risk, index) {
          if (typeof risk === 'string') {
            return { title: risk, owner: 'Red Team Agent', note: 'API thật đã gắn cờ rủi ro #' + (index + 1) + '.' };
          }
          return {
            title: String(risk.title || risk.risk || risk.name || ('Rủi ro ' + (index + 1))),
            owner: String(risk.owner || risk.persona || 'Red Team Agent'),
            note: String(risk.note || risk.reason || risk.summary || 'Agent thật đánh dấu cần theo dõi thêm.')
          };
        }) : [];
        const apiChecklist = Array.isArray(result && result.checklist) ? result.checklist.filter(Boolean).map(function (item) {
          if (typeof item === 'string') {
            return { task: item, owner: 'Checklist Agent', deadline: 'Cần chốt', status: 'Mở' };
          }
          return {
            task: String(item.task || item.title || item.action || 'Việc cần làm'),
            owner: String(item.owner || 'Checklist Agent'),
            deadline: String(item.deadline || item.when || 'Cần chốt'),
            status: String(item.status || 'Mở')
          };
        }) : [];
        const apiLessons = Array.isArray(result && result.lessons) ? result.lessons.filter(Boolean).map(function (item) {
          return typeof item === 'string' ? item : String(item.text || item.lesson || item.summary || 'Bài học cần lưu lại');
        }) : [];
        Stage.revealGauge(score, max, color);
        if (summary && summary !== fallbackRun.summary) {
          const note = document.createElement('div');
          note.className = 'demo-llm-note';
          note.innerHTML = '<strong>Agent thật đã trả kết quả.</strong><span>' + escapeHtml(summary) + '</span>';
          resGauge.appendChild(note);
        } else {
          const note = document.createElement('div');
          note.className = 'demo-llm-note';
          note.innerHTML = '<strong>Agent thật đã trả kết quả.</strong><span>Kết quả đã được bind vào gauge và các panel bên phải.</span>';
          resGauge.appendChild(note);
        }
        if (apiRisks.length) {
          const risksEl = document.getElementById('resRisks');
          if (risksEl) {
            risksEl.innerHTML = '<div class="demo-card-title">Thẻ rủi ro</div><div class="demo-list"></div>';
            apiRisks.forEach(function (card) { Stage.revealRisk(card); });
          }
        }
        if (apiChecklist.length) {
          const checklistEl = document.getElementById('resChecklist');
          if (checklistEl) {
            checklistEl.innerHTML = '<div class="demo-card-title">Việc cần làm</div><div class="demo-list"></div>';
            apiChecklist.forEach(function (item) { Stage.revealChecklist(item); });
          }
        }
        if (apiLessons.length) {
          Stage.revealLessons(apiLessons);
        }
        Stage.setPhaseActive(1);
        renderReasoningPanel(buildReasoningItems({
          runData: {
            score: score,
            maxScore: max,
            readinessLabel: readiness.label || readiness.readinessLabel || fallbackRun.readinessLabel,
            risks: apiRisks.length ? apiRisks : fallbackRun.risks,
            summary: summary || fallbackRun.summary
          },
          aiSuggestedBriefAdditions: DemoData.aiSuggestedBriefAdditions,
          source: 'api',
          decision: summary || fallbackRun.summary,
          statusLabel: 'Đã bind kết quả từ API thật'
        }), {
          tone: 'success',
          statusText: 'API thật phản hồi thành công',
          fallbackText: 'Gauge và các panel kết quả đã đồng bộ theo response, vẫn chỉ hiển thị reasoning mức cao.'
        });
      })
      .catch(function () {
        resGauge.innerHTML = '<div class="demo-card-title">Phân tích AI</div><div class="demo-muted">Không gọi được agent thật hoặc rule-mode đang tắt LLM. Demo deterministic vẫn hoạt động ổn.</div>';
        Stage.revealGauge(fallbackRun.score, fallbackRun.maxScore, fallbackRun.readinessColor);
        renderReasoningPanel(buildReasoningItems({
          runData: fallbackRun,
          source: 'fallback',
          decision: fallbackRun.summary,
          statusLabel: 'Dùng fallback deterministic'
        }), {
          tone: 'fallback',
          statusText: 'API lỗi hoặc rule-mode đang tắt LLM',
          fallbackText: 'Demo vẫn hiển thị các bước suy luận ổn định dựa trên brief hiện tại.'
        });
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
          button.textContent = '▶ Phân Tích AI';
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Expose ra global để có thể verify từ DevTools / preview_eval
  // ---------------------------------------------------------------------------
  window.DemoAssets = Assets;
  window.DemoFurniture = FURNITURE;
  window.DemoRoom = Room;
  window.DemoEngine = Engine;
  window.DemoCharacters = Characters;
  window.DemoPersonas = PersonaCharacters;
  window.DemoData = DemoData;
  window.DemoDirector = Director;
  window.DemoStage = Stage;
  window.DemoAgentBehavior = AgentBehavior;
  window.DemoBfsPath = bfsPath;

  // Helper debug: đổi state 1 agent theo key.
  window.DemoSetState = function (key, state) {
    const ch = getCharacter(key);
    if (ch && typeof ch.setState === 'function') {
      ch.setState(state);
      return true;
    }
    return false;
  };

  // Expose hằng số sprite (có thể dùng ở task sau)
  window.DemoConsts = {
    TILE: TILE,
    CHAR_FW: CHAR_FW,
    CHAR_FH: CHAR_FH,
    CHAR_ROW: CHAR_ROW,
    CHAR_FRAMES: CHAR_FRAMES,
    CHARACTER_SHEETS: CHARACTER_SHEETS,
    FLOOR_TILES: FLOOR_TILES,
    WALL_SHEET: WALL_SHEET
  };

})();
