module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: 'airbnb-base',
    ignorePatterns: ['src/com.simonedenadai.motu-avb.sdPlugin/libs/**/*', 'src/com.simonedenadai.motu-avb.sdPlugin/axios.min.js'],
    overrides: [
        {
            env: {
                node: true,
            },
            files: [
                '.eslintrc.{js,cjs}',
            ],
            parserOptions: {
                sourceType: 'script',
            },
        },
    ],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        indent: ['error', 4],
        'no-multiple-empty-lines': ['error', { max: 2 }],
    },
    globals: {
        axios: true,
        Action: true,
        $SD: true,
        Utils: true,
        $PI: true,
    },
};
