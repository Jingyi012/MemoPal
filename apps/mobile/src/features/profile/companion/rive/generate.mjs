// Editable vector rig for Momo. Run this file, then `rive . --verify` and `rive . --once`.
// All timelines use explicit easing; RML's default keyframe interpolation is HOLD.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let serial = 100;
const id = () => `0:${serial++}`;
const el = (tag, attrs = {}, children = '') => `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('')}>${Array.isArray(children) ? children.join('\n') : children}</${tag}>`;
const solid = (color) => el('SolidColor', { colorValue: color, name: 'Pigment' });
const gradient = (colors, x = 0, y = -60, ex = 0, ey = 70) => el('LinearGradient', { startX: x, startY: y, endX: ex, endY: ey, name: 'Pearlescent wash' }, colors.map((color, i) => el('GradientStop', { colorValue: color, position: i / (colors.length - 1) })));
const fill = (paint) => el('Fill', { name: 'Color' }, paint);
const stroke = (color, thickness = 1.5) => el('Stroke', { name: 'Soft edge', thickness, cap: 'round', join: 'round' }, solid(color));
const shape = (name, geo, paint, attrs = {}, edge = '') => el('Shape', { name, ...attrs }, geo + (paint ? fill(paint) : '') + edge);
const ellipse = (name, x, y, w, h, color, attrs = {}) => shape(name, el('Ellipse', { width: w, height: h }), solid(color), { x, y, ...attrs });
// Author in painter's order, reverse at each group: Rive paints first child on top.
const group = (name, children, attrs = {}) => el('Node', { name, ...attrs }, [...children].reverse());
const polygon = (points) => el('PointsPath', { isClosed: true }, points.map(([x, y]) => el('StraightVertex', { x, y, radius: 2 })));
const star = (name, x, y, size, color, attrs = {}) => shape(name, el('Star', { width: size, height: size, points: 4, innerRadius: 0.24, cornerRadius: 1 }), solid(color), { x, y, ...attrs });
// Bezier paths: each point is [x,y,inHandleX,inHandleY,outHandleX,outHandleY].
const path = (points, closed = true) => el('PointsPath', { isClosed: closed }, points.map(([x, y, ix = x, iy = y, ox = x, oy = y]) => el('CubicDetachedVertex', {
  x, y, inRotation: Math.atan2(iy - y, ix - x), inDistance: Math.hypot(ix - x, iy - y),
  outRotation: Math.atan2(oy - y, ox - x), outDistance: Math.hypot(oy - y, ox - x),
})));
const petal = (length, width) => path([
  [0, 0, -12, 10, -length * .45, -width * .75],
  [-length, -width * .45, -length * .9, -width, -length * 1.08, 0],
  [-length * .75, width * .45, -length, width * .65, -length * .45, width * .15],
]);
const heart = () => path([[0, 12, 10, 3, -10, 3], [-13, -5, -18, 2, -12, -16], [0, -6, -5, -16, 6, -17], [13, -5, 12, -16, 18, 2]]);
const easing = el('CubicEaseInterpolator', { x1: .42, y1: 0, x2: .58, y2: 1 });
const keyed = (objectId, property, values) => el('KeyedObject', { objectId }, el('KeyedProperty', { propertyKey: property }, values.map(([frame, value]) => el('KeyFrameDouble', { frame, value, interpolationType: 'cubic' }, easing))));
const animation = (name, animId, duration, keys, loop = false) => el('LinearAnimation', { name, id: animId, duration, fps: 60, loopValue: loop ? 'loop' : 'oneShot' }, keys);
const vm = id();
const instance = id();
const bodyAsset = id();
const actions = ['hello', 'pet', 'dance', 'highFive', 'correct', 'encourage', 'celebrate', 'think'];
const triggers = Object.fromEntries(actions.map((a) => [a, id()]));

function artboard(stage, icon = false) {
  const art = id(), machine = id(), style = id();
  const root = id(), tail = id(), fin = id(), eyes = id(), expression = id(), hearts = id(), sparks = id(), shell = id();
  const petals = Array.from({ length: 5 }, id);
  const bubbles = Array.from({ length: 3 }, id);
  const idle = id(), idleState = id(), blink = id(), blinkState = id(), water = id(), waterState = id();
  const anims = Object.fromEntries(actions.map((a) => [a, id()]));
  const states = Object.fromEntries(actions.map((a) => [a, id()]));
  const growth = Math.max(0, stage - 3);
  const size = icon ? 1.4 : stage === 1 ? .54 : stage === 2 ? .91 : stage === 3 ? .82 : .94;
  const fish = [];
  // Silky tail: five independently hinged, overlapping translucent petals.
  const tailLayers = petals.map((petalId, i) => {
    const length = 58 + growth * 14 + (i % 2) * 15;
    const width = 34 + growth * 6;
    const angle = (i - 2) * (.27 + growth * .012);
    return group(`Tail silk ${i + 1}`, [
      shape('Silk shadow', petal(length * 1.04, width * 1.05), gradient(['C8FE9F7F', '90C5A8EC', '80A9D8FC'], 0, 0, -length, 0), { x: -3, y: 4 }),
      shape('Iridescent silk', petal(length, width), gradient(['FFFFB273', 'F0FFD6B3', 'E3D2C6FB', '8DAEDDFC'], 0, 0, -length, 0), {}, stroke('D9FFF6E5', 1.8)),
      shape('Fin ray', path([[0,0,0,0,-length*.32,-7],[-length*.89,-width*.27,-length*.62,-width*.11,-length*.89,-width*.27]], false), '', {}, stroke('C7FFF9E6', 1.3)),
      shape('Fin ray glint', path([[0,1,0,1,-length*.28,width*.09],[-length*.75,width*.19,-length*.57,width*.18,-length*.75,width*.19]], false), '', {}, stroke('80FFF7F3', .8)),
    ], { id: petalId, rotation: angle });
  });
  fish.push(group('Living fan tail', tailLayers, { x: -49, y: 9, id: tail }));
  fish.push(shape('Crest glow', petal(59 + growth * 5, 40), gradient(['D9FFAD71', 'B9E8BEE9', '98C9D9FF']), { x: -18, y: -50, rotation: 1.08 }, stroke('AAFFF6E7', 1.5)));
  fish.push(shape('Crest fin', petal(51 + growth * 4, 31), gradient(['FFFFA25F', 'E9FFD9B5', 'A8DCD1FC']), { x: -18, y: -49, rotation: 1.08 }, stroke('CCFFF0D5')));
  fish.push(shape('Far ventral fin', petal(33 + growth * 3, 24), gradient(['FFFFBC81', 'FFFFEDDB']), { x: -23, y: 49, rotation: -.65 }));
  fish.push(el('Image', { name: 'Painted pearl body', assetId: bodyAsset, x: -9, y: -5, scaleX: .15, scaleY: .15 }));
  // Leave the body smooth and the face open: a few broad accents read at small sizes.
  fish.push(ellipse('Left blush', -12, 23, 23, 12, '65F78F98'));
  fish.push(ellipse('Right blush', 65, 21, 18, 10, '65F78F98'));
  const eyeShapes = [];
  for (const [x, y, s] of [[7, -5, 1], [56, -8, .89]]) {
    eyeShapes.push(group('Glossy cocoa eye', [
      ellipse('Soft eye socket', 0, 1, 32, 39, '45FFCFB6'),
      shape('Eye', el('Ellipse', { width: 27, height: 35 }), gradient(['FF382638','FF663A42','FFA86946'],0,-15,0,18), {}, stroke('A7FFF2D9', 1)),
      ellipse('Deep pupil', 1, -3, 18, 25, 'FF241E31'),
      ellipse('Honey reflection', 3, 9, 13, 9, 'FFD68758'),
      ellipse('Large eye light', -4, -8, 10, 12, 'FFFFFFFF'),
      ellipse('Tiny eye light', 5, 2, 4, 4, 'FFFFEACA'),
    ], { x, y, scaleX: s, scaleY: s }));
  }
  fish.push(group('Blink together', eyeShapes, { id: eyes }));
  fish.push(group('Smile expression', [
    shape('Happy open smile', path([[-12,-4,-12,-4,-8,0],[12,-4,8,0,13,8],[0,15,8,15,-8,15]]), solid('FF824143')),
    ellipse('Peach tongue', 0, 10, 13, 7, 'FFF38E99'),
  ], { id: expression, x: 34, y: 21, scaleX: .76, scaleY: .76 }));
  fish.push(shape('Left gill glint', path([[-43,19,-43,19,-37,27],[-28,34,-32,31,-25,35]], false), '', {}, stroke('80FFF4DE', 1.8)));
  fish.push(group('Waving pectoral fin', [
    shape('Hand fin', petal(40, 30), gradient(['FFFFB87F','E9FFD7BE','A8D3D5FB']), {}, stroke('D9FFF6E5',1.5)),
    shape('Hand fin crease', path([[0,0,0,0,-12,-3],[-27,-4,-19,-5,-27,-4]],false),'',{},stroke('99E88C68',1)),
  ], { x: -48, y: 26, rotation: -.25, id: fin }));
  if (stage >= 4) {
    fish.push(shape('Pearl side ribbon', petal(42 + growth * 4, 17), gradient(['DCFFCB9A','A9E6C6ED','69AACDFB']), { x:-37, y:44, rotation:-.42 }, stroke('C9FFF5E6',1.1)));
    fish.push(shape('Pearl side ribbon glint', path([[0,0,0,0,-15,5],[-36,3,-25,5,-36,3]], false), '', {x:-37,y:44,rotation:-.42}, stroke('96FFF9EE',.9)));
  }

  if (stage >= 7) {
    const crown = [];
    if (stage >= 8) crown.push(shape('Golden tiara', polygon([[-37,0],[-42,-23],[-23,-12],[-10,-34],[3,-12],[22,-26],[19,2]]), gradient(['FFFFF0BC','FFF1BA62']), {}, stroke('FFFFF2C9',2)));
    for (const [x, y] of [[-34,-3],[-17,-8],[2,-6],[19,-2]]) {
      if (stage < 10) {
        const flower = Array.from({ length: 5 }, (_, j) => ellipse('Pearl petal', Math.cos(j*1.256)*5,Math.sin(j*1.256)*5,8,8, j%2?'FFFFF5E8':'FFF7CEDB'));
        flower.push(ellipse('Flower center',0,0,5,5,'FFFFCC78'));
        crown.push(group('Flower',flower,{x,y}));
      } else crown.push(ellipse('Crown pearl',x,y,7,7,'FFFFF5D9'));
    }
    if (stage >= 8) crown.push(shape('Heart gem',heart(),gradient(['FFB0EBE6','FF67BDC8']),{x:-10,y:-12,scaleX:.42,scaleY:.42}));
    fish.push(group('Earned crown',crown,{x:5,y:-62,rotation:.15}));
  }
  if (stage === 2) {
    fish.push(shape('Hatching shell',path([[-80,15,-80,15,-85,40],[-42,85,-75,75,-20,100],[54,77,30,98,80,60],[83,8,83,45,83,8],[61,23,61,23,61,23],[42,9,42,9,42,9],[23,29,23,29,23,29],[0,14,0,14,0,14],[-23,32,-23,32,-23,32],[-49,10,-49,10,-49,10],[-64,29,-64,29,-64,29]]),gradient(['FFFFFCF2','FFEBDFF8']),{y:18,id:shell},stroke('FFFFF7EA',2)));
    fish.push(ellipse('Shell pearl spot',-37,77,18,11,'80FFFFFF'));
    fish.push(shape('Eggshell cap',path([[-48,3,-48,3,-49,-30],[3,-39,-28,-50,25,-38],[35,-14,30,-30,35,-14],[16,-4,16,-4,16,-4],[0,-15,0,-15,0,-15],[-14,3,-14,3,-14,3],[-30,-7,-30,-7,-30,-7]]),gradient(['FFFFFEF5','FFE8DCF4']),{x:-31,y:-65,rotation:-.27,scaleX:.72,scaleY:.72}));
  }
  const heartShapes = [[-36,-99,1],[74,-76,.7],[-92,-25,.5]].map(([x,y,s])=>shape('Affection',heart(),gradient(['FFFFC3CF','FFF18BA6']),{x,y,scaleX:s,scaleY:s}));
  fish.push(group('Heart response',heartShapes,{id:hearts,opacity:0}));
  fish.push(group('Success sparkles',[[93,-46,25],[-105,-80,20],[62,85,18],[-72,79,15]].map(([x,y,s])=>star('Happy sparkle',x,y,s,'FFFFD778')),{id:sparks,opacity:0}));

  const scene = [];
  if (icon) scene.push(shape('App icon background',el('Rectangle',{width:480,height:480}),gradient(['FF29264F','FF515080'],0,-240,0,240),{x:240,y:240}));
  scene.push(ellipse('Water shadow',240,355,200,22,'124E407E'));
  if(stage>=9) {
    scene.push(shape('Starlight orbit',el('Ellipse',{width:360,height:260}),'',{x:230,y:228,rotation:-.45},stroke('70EFCB92',1.6)));
    for(const [x,y,s] of [[94,189,19],[370,142,23],[129,322,13],[346,327,15]]) scene.push(star('Orbit star',x,y,s,'FFFFDB9C'));
  }
  if(stage===10) {
    scene.push(shape('Crescent moon',path([[8,-46,40,-46,-35,-55],[-26,34,-63,13,-9,53],[24,39,13,49,-9,31],[-7,-16,-20,20,-3,-34]]),gradient(['FFFFF0B1','FFF8CB81']),{x:170,y:110,rotation:-.2}));
  }
  const fishNode = group('Momo complete character rig',fish,{x:stage<=2?250:284,y:icon?225:stage===2?211:233,scaleX:size,scaleY:size,id:root});
  scene.push(fishNode);
  if (stage===1) {
    scene.push(shape('Luminous egg',path([[0,-104,46,-104,-49,-104],[-72,38,-88,-20,-65,99],[63,48,50,106,87,3]]),gradient(['35FFFAE6','50FFE6AF','70E2D9F5']),{x:247,y:226,id:shell},stroke('E6FFF6DC',3)));
    scene.push(shape('Egg glass glint',path([[-20,-70,-20,-70,-50,-49],[-50,-15,-51,-38,-50,-15]],false),'',{x:247,y:226},stroke('D9FFFFFF',7)));
    scene.push(star('Little life',272,142,15,'FFFFFFEB'));
  }
  for(let i=0;i<3;i++) {
    const x=[104,365,391][i], y=[129,104,297][i], r=[11,8,6][i];
    scene.push(group('Floating pearl',[
      shape('Bubble',el('Ellipse',{width:r*2,height:r*2}),gradient(['40B9DCEC','20DAD2F4']),{},stroke('AAE6E1FF',1.5)),
      ellipse('Bubble light',-r*.3,-r*.35,r*.55,r*.4,'CCFFFFFF'),
    ],{x,y,id:bubbles[i]}));
  }
  // Ambient fin motion and blinking keep running while reactions blend over the body.
  const waterKeys = [keyed(tail,15,[[0,-.045],[60,.055],[120,-.045],[180,-.045]])];
  petals.forEach((p,i)=> {const a=(i-2)*(.27+growth*.012); waterKeys.push(keyed(p,15,[[0,a-.035],[35+i*9,a+.065],[95+i*9,a-.065],[180,a-.035]]));});
  bubbles.forEach((b,i)=>waterKeys.push(keyed(b,14,[[0,[129,104,297][i]],[90,[129,104,297][i]-12-i*2],[180,[129,104,297][i]]])));
  const baseY=icon?225:stage===2?211:233, baseX=stage<=2?250:284;
  const neutralKeys = (duration) => [
    keyed(root,13,[[0,baseX],[duration,baseX]]), keyed(root,14,[[0,baseY],[duration/2,baseY-7],[duration,baseY]]),
    keyed(root,15,[[0,-.025],[duration/2,.025],[duration,-.025]]),
    keyed(root,16,[[0,size],[duration,size]]),keyed(root,17,[[0,size],[duration,size]]),
    keyed(fin,15,[[0,-.25],[duration/2,-.02],[duration,-.25]]),keyed(expression,17,[[0,1],[duration,1]]),
    keyed(hearts,18,[[0,0],[duration,0]]),keyed(sparks,18,[[0,0],[duration,0]]),
  ];
  const durations={hello:96,pet:108,dance:168,highFive:90,correct:84,encourage:120,celebrate:156,think:132};
  const motion={
    hello:{y:[0,-17,-5,-15,0],r:[0,-.08,.05,-.025,0],f:[-.25,-1,.15,-.8,-.25]},
    pet:{y:[0,4,-5,2,0],r:[0,-.12,-.06,.04,0],f:[-.25,-.6,-.3,-.5,-.25]},
    dance:{y:[0,-12,3,-18,0],r:[0,.18,-.18,.13,0],f:[-.25,-.9,.2,-.9,-.25]},
    highFive:{y:[0,5,-19,-7,0],r:[0,.08,-.14,-.06,0],f:[-.25,.1,1.7,1.4,-.25]},
    correct:{y:[0,6,-24,-5,0],r:[0,.05,-.1,.04,0],f:[-.25,-.25,.6,.1,-.25]},
    encourage:{y:[0,3,-4,-2,0],r:[0,.07,-.09,-.04,0],f:[-.25,.15,-.5,-.1,-.25]},
    celebrate:{y:[0,6,-34,-19,0],r:[0,-.12,.2,-.13,0],f:[-.25,.5,-.8,.7,-.25]},
    think:{y:[0,-3,-3,-1,0],r:[0,-.13,-.13,-.07,0],f:[-.25,-.8,-.8,-.5,-.25]},
  };
  const reactions = actions.map(a=> {
    const d=durations[a], m=motion[a], frames=[0,Math.round(d*.18),Math.round(d*.42),Math.round(d*.72),d];
    const keys=neutralKeys(d).filter(k=>!new RegExp(`objectId="(${root}|${fin})"`).test(k));
    keys.push(keyed(root,13,frames.map((f,i)=>[f,baseX+(a==='dance'?[0,9,-9,8,0][i]:0)])));
    keys.push(keyed(root,14,frames.map((f,i)=>[f,baseY+m.y[i]])));
    keys.push(keyed(root,15,frames.map((f,i)=>[f,m.r[i]])));
    keys.push(keyed(root,16,frames.map((f,i)=>[f,size*[1,1.035,.975,1.012,1][i]])));
    keys.push(keyed(root,17,frames.map((f,i)=>[f,size*[1,.965,1.025,.988,1][i]])));
    keys.push(keyed(fin,15,frames.map((f,i)=>[f,m.f[i]])));
    const mouthShape = a === 'think' ? [.76,.68,.62,.72,.76] : a === 'celebrate' || a === 'correct' ? [1,1.15,1.37,1.17,1] : a === 'encourage' ? [1,.82,.72,.88,1] : [1,1.08,1.17,1.06,1];
    const mouthKey = keys.findIndex(k=>k.includes(`objectId="${expression}"`));
    keys.splice(mouthKey,1,keyed(expression,17,frames.map((f,i)=>[f,mouthShape[i]])));
    // Replace neutral effect channels, keeping an explicit zero at each end.
    const effect=a==='pet'||a==='encourage'?hearts:a==='think'?null:sparks;
    if(effect){const ix=keys.findIndex(k=>k.includes(`objectId="${effect}"`));keys.splice(ix,1,keyed(effect,18,frames.map((f,i)=>[f,[0,.5,1,.8,0][i]])));}
    return animation(a,anims[a],d,keys);
  });
  const transitions=actions.map(a=>el('StateTransition',{stateToId:states[a],duration:110,enableEarlyExit:true},el('TransitionViewModelCondition',{},[
    el('TransitionPropertyViewModelComparator',{},el('BindablePropertyTrigger',{},el('DataBindContext',{sourcePathIds:`${vm}-${triggers[a]}`,propertyKey:686}))),el('TransitionValueTriggerComparator'),
  ])));
  const sm=el('StateMachine',{name:'Momo Companion',id:machine},[
    el('StateMachineLayer',{name:'Water and silk'},[el('EntryState',{x:0,y:0},el('StateTransition',{stateToId:waterState})),el('AnimationState',{x:200,y:0,id:waterState,animationId:water})]),
    el('StateMachineLayer',{name:'Emotional responses'},[
      el('EntryState',{x:0,y:0},el('StateTransition',{stateToId:idleState})),el('AnyState',{x:200,y:-160},transitions),
      el('AnimationState',{x:200,y:0,id:idleState,animationId:idle}),
      ...actions.map((a,i)=>el('AnimationState',{x:450+(i%4)*220,y:Math.floor(i/4)*150,id:states[a],animationId:anims[a],reset:true},el('StateTransition',{stateToId:idleState,duration:220,enableExitTime:true,exitTimeIsPercetange:true,exitTime:100}))),
    ]),
    el('StateMachineLayer',{name:'Natural blink'},[el('EntryState',{x:0,y:0},el('StateTransition',{stateToId:blinkState})),el('AnimationState',{x:200,y:0,id:blinkState,animationId:blink})]),
  ]);
  const compact = stage <= 6;
  return el('Artboard',{id:art,name:icon?'Momo Icon':`Momo ${String(stage).padStart(2,'0')}`,width:icon?480:compact?320:400,height:icon?480:compact?320:360,x:(stage-1)*520,y:icon?500:0,styleId:style,defaultStateMachineId:machine,viewModelId:vm},[
    el('LayoutComponentStyle',{id:style,name:'Artboard style'}),
    group('Aquarium framing', scene, {x:icon?0:compact?-80:-40,y:icon?0:compact?-50:-30}), sm,
    animation('Breathe and float',idle,240,neutralKeys(240),true),
    animation('Silk in water',water,180,waterKeys,true),
    animation('Blink',blink,318,[keyed(eyes,17,[[0,1],[145,1],[150,.08],[156,1],[280,1],[285,.08],[291,1],[318,1]])],true),
    ...reactions,
  ]);
}

const boards=Array.from({length:10},(_,i)=>artboard(i+1));
boards.push(artboard(2,true));
const controls=el('ViewModel',{id:vm,name:'Momo Controls',defaultInstanceId:instance},[
  ...actions.map(a=>el('ViewModelPropertyTrigger',{id:triggers[a],name:a})),
  el('ViewModelInstance',{id:instance,name:'Momo',exports:true},actions.map(a=>el('ViewModelInstanceTrigger',{viewModelPropertyId:triggers[a]}))),
]);
writeFileSync(fileURLToPath(new URL('./scene.rml',import.meta.url)),el('Rive',{version:1,kind:'fragment'},[...boards,controls,el('ImageAsset',{id:bodyAsset,name:'Pearl body painting',file:'assets/pearl-body.png'})]));
writeFileSync(fileURLToPath(new URL('./rive.yaml',import.meta.url)),'name: memopal-momo\nmain: Momo 02\n');
