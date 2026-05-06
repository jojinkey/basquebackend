import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '../../context/ModalContext'
import TableBookingModal from './TableBookingModal'
import CourtBookingModal from './CourtBookingModal'
import GolfBookingModal from './GolfBookingModal'
import EventEnquiryModal from './EventEnquiryModal'
import GolfDiningModal from './GolfDiningModal'
import styles from './BookingModalShell.module.css'

const MODAL_MAP = {
  table: TableBookingModal,
  court: CourtBookingModal,
  golf: GolfBookingModal,
  event: EventEnquiryModal,
  golfDining: GolfDiningModal,
}

const BookingModalShell = () => {
  const { modal, closeModal } = useModal()
  const ActiveModal = modal.type ? MODAL_MAP[modal.type] : null

  return (
    <AnimatePresence mode="wait">
      {modal.isOpen && ActiveModal && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeModal}
          />
          <motion.div
            className={styles.panel}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.topBar}>
              <span className={styles.logo}>BASQUE</span>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M1 1L17 17M17 1L1 17" stroke="var(--teak)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className={styles.content}>
              <ActiveModal prefill={modal.prefill} onClose={closeModal} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default BookingModalShell
