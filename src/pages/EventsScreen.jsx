import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { formatNumber } from '../utils/format.js';
import toast from 'react-hot-toast';

export default function EventsScreen() {
  const { events, fetchEventsAction, bookEventAction, nodeTier } = useGameStore();
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    fetchEventsAction();
  }, [fetchEventsAction]);

  const handleBook = async (event) => {
    if (bookingId) return;
    if (nodeTier < 1) {
      return toast.error("Node Required! Only activated nodes can book VIP seats.", { icon: '🔒', duration: 4000 });
    }

    const price = Number(event.price_aip || 0);
    const { localReward } = useGameStore.getState();
    if (price > 0 && localReward < price) {
      return toast.error(`Not enough $AIP. You need ${formatNumber(price)} $AIP.`);
    }

    try {
      setBookingId(event.id);
      const res = await bookEventAction(event.id);
      if (res?.success) {
        toast.success("Seat Booked Successfully! View your ticket below.", { icon: '🎟️', duration: 5000 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to book seat');
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div className="page page-events" style={{ paddingBottom: 80 }}>
      <div style={{ padding: '10px 0 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 900 }}>📅 VIP WEBINARS</h2>
        <p style={{ fontSize: '12px', color: '#A3FF12', fontWeight: 700, marginTop: 4 }}>
          EXCLUSIVE FULL PRESENTATION SHOWS
        </p>
      </div>

      <div className="flex-column" style={{ gap: 16 }}>
        {!Array.isArray(events) || events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: '40px 20px' }}>
            No upcoming events right now. Check back later!
          </div>
        ) : (
          events.map(event => {
            const isFull = Number(event.booked_seats) >= Number(event.max_seats);
            const isBooked = event.is_booked;
            const isBooking = bookingId === event.id;
            const price = Number(event.price_aip || 0);
            const canBook = !isBooked && !isFull;
            const progress = Math.min((Number(event.booked_seats) / Number(event.max_seats)) * 100, 100);

            return (
              <div key={event.id} className="partner-card" style={{ padding: 16, border: isBooked ? '1px solid var(--neon-lime)' : '1px solid rgba(255,255,255,0.05)' }}>
                {isBooked && (
                  <div style={{
                    background: 'var(--neon-lime)', color: '#000', padding: '6px 12px', borderRadius: '8px', 
                    fontSize: 11, fontWeight: 900, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>🎟️ SEAT RESERVED</span>
                    <a href={event.telegram_link} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'underline' }}>
                      JOIN MEETING
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{event.title}</h3>
                    {event.schedule_time && (
                      <div style={{ fontSize: 11, color: '#FFD700', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⏱️ {event.schedule_time}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{event.description}</p>
                  </div>
                </div>

                {/* Progress Bar for Seats */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: '#4FC3F7', marginBottom: 6 }}>
                    <span>{event.booked_seats} / {event.max_seats} Seats Booked</span>
                    <span>{Math.floor(progress)}% Full</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: isFull ? '#FF5252' : 'linear-gradient(90deg, #4FC3F7, var(--neon-lime))',
                      width: `${progress}%`,
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                </div>

                {!isBooked && (
                  <button
                    onClick={() => handleBook(event)}
                    disabled={isBooking || isFull}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isFull ? 'rgba(255,255,255,0.05)' : 'var(--neon-lime)',
                      color: isFull ? 'rgba(255,255,255,0.3)' : '#000',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {isBooking ? 'Processing...' : isFull ? 'SOLD OUT' : (
                      <>
                        <span>BOOK SEAT</span>
                        {price > 0 ? <span style={{ background: '#000', color: 'var(--neon-lime)', padding: '2px 6px', borderRadius: 6, fontSize: 10 }}>{formatNumber(price)} $AIP</span> : <span style={{ background: '#000', color: '#fff', padding: '2px 6px', borderRadius: 6, fontSize: 10 }}>FREE</span>}
                      </>
                    )}
                  </button>
                )}
                
                {!isBooked && nodeTier === 0 && !isFull && (
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#FF5252', fontWeight: 800 }}>
                    🔒 Activated Node Required to attend
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
