module.exports = function (api) {
  api.cache(true);
  
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    presets: ['babel-preset-expo'],
    // Disable nativewind/babel in test environment to avoid PostCSS async issues
    plugins: isTest ? [] : ['nativewind/babel'],
  };
};
