import anime from 'animejs';

export const fadeInUp = (target, options = {}) => {
  anime({
    targets: target,
    translateY: [24, 0],
    opacity: [0, 1],
    duration: 600,
    easing: 'easeOutExpo',
    ...options,
  });
};

export const shimmer = (target, options = {}) => {
  anime({
    targets: target,
    backgroundPosition: ['0% 0%', '100% 100%'],
    duration: 1400,
    easing: 'easeInOutQuad',
    loop: true,
    ...options,
  });
};
