module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ['babel-preset-expo', {
                unstable_transformImportMeta: true
            }]
        ],
        plugins: [
            // 如果你使用@babel/plugin-transform-react-jsx-source，确保它被包含
            process.env.NODE_ENV !== 'production' ? 'react-native-reanimated/plugin' : null
        ].filter(Boolean)
    };
};