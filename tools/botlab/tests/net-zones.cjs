// [karp-face] Zone Control across a host change (netmatch.onLeave's narrowed flush): net-tower.cjs with mode=zones.
//   CLIENTS=3 Q0=autopilot Q1=autopilot Q2=autopilot NET=tools/botlab/tests/net-zones.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
module.exports = (ctx) => require('./net-tower.cjs')({ ...ctx, args: 'mode=zones' + (ctx.args ? '&' + ctx.args : '') });
