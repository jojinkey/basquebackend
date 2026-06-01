import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDeliveryOrder } from '../services/deliveryOrderApi';
import {socket} from '../services/socket';
import styles from './OrderTrackingPage.module.css';

const STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'preparing', label: 'Being Prepared' },
  { key: 'dispatched', label: 'Picked Up by Rider' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Initial fetch and polling fallback
  useEffect(() => {
    let pollInterval;
    
    const fetchOrder = async () => {
      try {
        const data = await getDeliveryOrder(orderId);
        if (data) {
          setOrder(data);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Fallback polling if socket isn't connected
    if (!socket.connected) {
      pollInterval = setInterval(fetchOrder, 30000);
    }

    return () => clearInterval(pollInterval);
  }, [orderId]);

  // Real-time socket listener
  useEffect(() => {
    const handleOrderUpdated = (updatedOrder) => {
      if (updatedOrder.id === orderId) {
        // Merge the updated fields (like status and rider info) into state
        setOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
    };

    socket.on('deliveryOrder:updated', handleOrderUpdated);
    
    return () => {
      socket.off('deliveryOrder:updated', handleOrderUpdated);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loader}>Loading your order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorCard}>
          <h2>Order not found.</h2>
          <p>Please check your order ID or contact Basque support.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        
        {/* [1] Order Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h2>Order Summary</h2>
            <span className={styles.orderId}>{order.clientOrderNumber}</span>
          </div>
          <p className={styles.date}>
            Placed on: {new Date(order.createdAt).toLocaleString()}
          </p>
          
          <div className={styles.itemsList}>
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <span className={styles.itemName}>{item.name} x {item.qty}</span>
                <span className={styles.itemPrice}>₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Delivery</span>
              <span>₹{order.deliveryCharge}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>

          <div className={styles.deliveryInfo}>
            <h3>Delivery Details</h3>
            <p>{order.customerName}</p>
            <p>{order.deliveryAddress}</p>
            <p>{order.deliveryCity}, {order.deliveryState} {order.deliveryPincode}</p>
          </div>
        </div>

        {/* [2] Live Tracking Timeline */}
        <div className={styles.trackingCard}>
          <h2>Live Tracking</h2>
          <div className={styles.stepper}>
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className={styles.step}>
                  <div className={styles.stepIndicator}>
                    {isCompleted && <div className={`${styles.circle} ${styles.completed}`}>✓</div>}
                    {isActive && <div className={`${styles.circle} ${styles.active}`}></div>}
                    {isPending && <div className={`${styles.circle} ${styles.pending}`}></div>}
                    {/* Connecting line */}
                    {index !== STEPS.length - 1 && <div className={styles.line}></div>}
                  </div>
                  <div className={`${styles.stepLabel} ${isActive ? styles.activeText : ''}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* [3] Rider Info Card */}
          {(order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') && (
            <motion.div 
              className={styles.riderCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.riderIcon}>🚚</div>
              <div className={styles.riderDetails}>
                <h3>Your order is on the way!</h3>
                <p><strong>Rider:</strong> {order.shadowfaxRiderName || 'Assigning...'}</p>
                {order.shadowfaxRiderPhone && (
                  <p>
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${order.shadowfaxRiderPhone}`}>{order.shadowfaxRiderPhone}</a>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}