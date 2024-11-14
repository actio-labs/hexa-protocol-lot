import Matter from 'matter-js';
import { useEffect } from 'react';

const Background = () => {
  useEffect(() => {
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Composite = Matter.Composite,
          Common = Matter.Common,
          MouseConstraint = Matter.MouseConstraint,
          Mouse = Matter.Mouse,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Body = Matter.Body,
          Events = Matter.Events;

    // Token resimleri
    const tokenImages = [
      '/hexa-protocol-lot/taikopnglogo.png',
      '/hexa-protocol-lot/usdcpnglogo.png',
      '/hexa-protocol-lot/hexa-logo-transparent.png'
    ];

    // engine oluştur
    const engine = Engine.create();
    const world = engine.world;
    
    // Global yerçekimini kapat
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    // renderer oluştur
    const render = Render.create({
      element: document.getElementById('matter-background'),
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'linear-gradient(135deg, #000000 0%, #312e81 50%, #0b0218 100%)',
        showAngleIndicator: false
      }
    });

    // runner oluştur
    const runner = Runner.create();

    // Token sınıfı
    class Token {
      constructor(body) {
        this.body = body;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Common.random(1, 3);
        this.amplitude = Common.random(0.1, 0.3);
        this.timeOffset = Date.now();
      }

      update() {
        const time = (Date.now() - this.timeOffset) * 0.001;
        const dx = Math.cos(this.angle + time) * this.amplitude;
        const dy = Math.sin(this.angle + time) * this.amplitude + 0.5;
        
        Body.setVelocity(this.body, {
          x: this.body.velocity.x + dx,
          y: this.body.velocity.y + dy
        });

        // Hızı sınırla
        const speed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
        if (speed > this.speed) {
          const factor = this.speed / speed;
          Body.setVelocity(this.body, {
            x: this.body.velocity.x * factor,
            y: this.body.velocity.y * factor
          });
        }
      }
    }

    const tokens = new Map();

    // Yeni token oluşturma fonksiyonu
    const createToken = () => {
      const x = Common.random(50, window.innerWidth - 50);
      const size = Common.random(30, 50);
      const imageUrl = tokenImages[Math.floor(Math.random() * tokenImages.length)];
      
      const body = Bodies.circle(x, -50, size / 2, {
        restitution: 0.8,
        friction: 0.001,
        density: 0.001,
        render: {
          sprite: {
            texture: imageUrl,
            xScale: size / 100,
            yScale: size / 100
          }
        }
      });

      const token = new Token(body);
      tokens.set(body.id, token);
      
      return body;
    };

    // Token ekleme fonksiyonu
    const addNewToken = () => {
      const body = createToken();
      Composite.add(world, body);
    };

    // Her frame'de tokenleri güncelle
    Events.on(engine, 'beforeUpdate', () => {
      tokens.forEach(token => token.update());
    });

    // Alt sınırı kontrol et ve tokenları kaldır
    Events.on(engine, 'afterUpdate', () => {
      const bodies = Composite.allBodies(world);
      bodies.forEach(body => {
        if (!body.isStatic) {
          if (body.position.y > window.innerHeight + 100) {
            World.remove(world, body);
            tokens.delete(body.id);
          }
        }
      });
    });

    // Çarpışma olaylarını dinle
    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const tokenA = tokens.get(pair.bodyA.id);
        const tokenB = tokens.get(pair.bodyB.id);
        
        if (tokenA && tokenB) {
          // Çarpışma sonrası yeni rastgele açılar ata
          tokenA.angle = Math.random() * Math.PI * 2;
          tokenB.angle = Math.random() * Math.PI * 2;
          
          // Hızları biraz artır
          tokenA.speed *= 1.1;
          tokenB.speed *= 1.1;
          
          // Maksimum hızı sınırla
          tokenA.speed = Math.min(tokenA.speed, 3);
          tokenB.speed = Math.min(tokenB.speed, 3);
        }
      });
    });

    // Intervaller
    const tokenInterval = setInterval(addNewToken, 2000);

    // Görünmez yan duvarları ekle
    Composite.add(world, [
      Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { 
        isStatic: true,
        render: { visible: false }
      }),
      Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { 
        isStatic: true,
        render: { visible: false }
      })
    ]);

    // mouse kontrolü ekle
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    // render ve runner'ı başlat
    Render.run(render);
    Runner.run(runner, engine);

    // Pencere boyutu değiştiğinde canvas'ı güncelle
    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      render.options.width = window.innerWidth;
      render.options.height = window.innerHeight;
      
      // Duvarları yeniden konumlandır
      World.clear(world, false);
      Composite.add(world, [
        Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { 
          isStatic: true,
          render: { visible: false }
        }),
        Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { 
          isStatic: true,
          render: { visible: false }
        })
      ]);
    };

    window.addEventListener('resize', handleResize);

    // cleanup
    return () => {
      clearInterval(tokenInterval);
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      World.clear(world);
      Engine.clear(engine);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};
    };
  }, []);

  return <div id="matter-background" style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} />;
};

export default Background; 