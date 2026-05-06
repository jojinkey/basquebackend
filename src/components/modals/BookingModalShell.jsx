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
          <div className={styles.panelWrap}>
            <motion.div
              className={styles.panel}
              initial={{ scale: 0.94, opacity: 0, y: 32 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                  <span className={styles.logo}>BASQUE</span>
                  <span className={styles.logoTag}>Dehradun · Est. 1924</span>
                </div>
                <button className={styles.closeBtn} onClick={closeModal} aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="var(--teak)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className={styles.content}>
                <ActiveModal prefill={modal.prefill} onClose={closeModal} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default BookingModalShell
