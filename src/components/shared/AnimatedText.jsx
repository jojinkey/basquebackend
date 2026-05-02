import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const AnimatedText = ({ text, type = 'words', delay = 0, className = '', style = {} }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  if (type === 'words') {
    const words = text.split(' ')
    return (
      <span ref={ref} className={className} style={{ display: 'flex', flexWrap: 'wrap', gap: '0 0.28em', ...style }}>
        {words.map((word, i) => (
          <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
            <motion.span
              style={{ display: 'inline-block' }}
              initial={{ y: '105%', opacity: 0 }}
              animate={isInView ? { y: '0%', opacity: 1 } : {}}
              transition={{
                delay: delay + i * 0.08,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    )
  }

  // chars
  const chars = text.split('')
  return (
    <span ref={ref} className={className} style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            delay: delay + i * 0.025,
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

export default AnimatedText
