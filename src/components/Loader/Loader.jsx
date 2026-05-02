import { motion } from 'framer-motion'
import { useEffect } from 'react'
import AnimatedText from '../shared/AnimatedText'
import styles from './Loader.module.css'

const Loader = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className={styles.loader}
      exit={{
        opacity: 0,
        scale: 1.06,
        filter: 'blur(28px) saturate(2.5) brightness(1.4)',
      }}
      transition={{
        duration: 1.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.div
        className={styles.wordmark}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        BASQUE
      </motion.div>

      <motion.div
        className={styles.rule}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      />

      <div className={styles.tagline}>
        <AnimatedText
          text="Restaurant · Garden · Pickleball"
          type="chars"
          delay={1.1}
        />
      </div>

      <motion.div
        className={styles.progressBar}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 2.4, ease: 'linear' }}
      />
    </motion.div>
  )
}

export default Loader
