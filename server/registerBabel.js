require('@babel/register')({
  extensions: ['.js', '.jsx'],
  presets: [
    [
      '@babel/preset-env',
      { targets: { node: 'current' } }
    ],
    [
      '@babel/preset-react',
      { runtime: 'automatic' }
    ]
  ],
  ignore: [/node_modules/]
});
