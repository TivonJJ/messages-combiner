var mc = require('../dist/cjs')


mc.combineWatcher('./source',{
    output:'../output',
    namespace:{
        "/locales/**/*": "common",
        "/pages/**/*": "pages",
    },
    mergeMode: 'merge',
    unFlatten: true,
})

console.log('Delecting...')