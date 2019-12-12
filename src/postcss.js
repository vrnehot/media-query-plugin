/**
 * The PostCSS plugin component is supposed to extract the media CSS from the source chunks.
 * The CSS get saved in the store.
 */

const postcss = require('postcss');
const store = require('./store');

module.exports = postcss.plugin('MediaQueryPostCSS', options => {

    function addToStore(name, atRule) {

        const css = postcss.root().append(atRule).toString();
        const query = atRule.params || '';

        store.addMedia(name, css, options.path, query);
    }

    function getGroupName(name) {
        const groupNames = Object.keys(options.groups);

        for (let i = 0; i < groupNames.length; i++) {
            const groupName = groupNames[i];
            const group = options.groups[groupName];

            if (group instanceof RegExp && name.match(group)) {
                return groupName;
            }
            if (typeof group === 'object' && group.indexOf(name) !== -1) {
                return groupName;
            }
        }
    }

    return (css, result) => {

        css.walk(node => {
            if(node.type === 'atrule' && node.name === 'media'){
                const queryname = options.queries[node.params];

                if (queryname) {
                    const groupName = getGroupName(options.basename);
                    const name = groupName ? `${groupName}-${queryname}` : `${options.basename}-${queryname}`;

                    addToStore(name, node);
                    node.remove();
                    return;
                }
            }
            if(node.type === 'rule' && options.selectors){
                // node.selector
                for(const queryname in options.selectors){
                    let inList = options.selectors[queryname].reduce((r, el) => { return r || node.selector.startsWith(el) }, false);

                    if(inList){
                        const groupName = getGroupName(options.basename);
                        const name = groupName ? `${groupName}-${queryname}` : `${options.basename}-${queryname}`;

                        addToStore(name, node);
                        node.remove();
                        return;
                    }
                }
            }
        });
    };
});