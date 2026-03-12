'use client';

import { useState } from 'react';
import { usePrayer } from './PrayerContext';
import { MusicBar } from './MusicBar';
import type { UserPrayerCard } from '@/lib/prayerData';

type CardTab = 'active' | 'answered';

interface CardModalState {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'answer' | 'delete';
  card?: UserPrayerCard;
}

export function MyCards() {
  const {
    state,
    navigateTo,
    addCard,
    editCard,
    removeCard,
    markAsAnswered,
  } = usePrayer();

  const [activeTab, setActiveTab] = useState<CardTab>('active');
  const [modal, setModal] = useState<CardModalState>({ isOpen: false, mode: 'add' });
  const [formTitle, setFormTitle] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formTestimony, setFormTestimony] = useState('');

  const cards = activeTab === 'active' ? state.activeCards : state.answeredCards;

  const openAddModal = () => {
    setFormTitle('');
    setFormDetails('');
    setModal({ isOpen: true, mode: 'add' });
  };

  const openEditModal = (card: UserPrayerCard) => {
    setFormTitle(card.title);
    setFormDetails(card.details || '');
    setModal({ isOpen: true, mode: 'edit', card });
  };

  const openAnswerModal = (card: UserPrayerCard) => {
    setFormTestimony(card.testimony || '');
    setModal({ isOpen: true, mode: 'answer', card });
  };

  const openDeleteModal = (card: UserPrayerCard) => {
    setModal({ isOpen: true, mode: 'delete', card });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add' });
    setFormTitle('');
    setFormDetails('');
    setFormTestimony('');
  };

  const handleSave = () => {
    if (modal.mode === 'add') {
      if (formTitle.trim()) {
        addCard(formTitle.trim(), formDetails.trim() || null);
        closeModal();
      }
    } else if (modal.mode === 'edit' && modal.card) {
      if (formTitle.trim()) {
        editCard(modal.card.id, formTitle.trim(), formDetails.trim() || null);
        closeModal();
      }
    } else if (modal.mode === 'answer' && modal.card) {
      markAsAnswered(modal.card.id, formTestimony.trim() || null);
      closeModal();
    } else if (modal.mode === 'delete' && modal.card) {
      removeCard(modal.card.id);
      closeModal();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <MusicBar showThemeSelector={false} />

      <div className="prayer-my-cards">
        {/* Header */}
        <div className="prayer-header">
          <button className="prayer-back-btn" onClick={() => navigateTo('dashboard')}>
            ← Back
          </button>
          <h1 className="prayer-page-title">My Cards</h1>
        </div>

        {/* Tabs */}
        <div className="cards-tabs">
          <button
            className={`cards-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span className="tab-count">{state.activeCards.length}</span>
          </button>
          <button
            className={`cards-tab ${activeTab === 'answered' ? 'active' : ''}`}
            onClick={() => setActiveTab('answered')}
          >
            Answered
            <span className="tab-count">{state.answeredCards.length}</span>
          </button>
        </div>

        {/* Add Card Button (Active tab only) */}
        {activeTab === 'active' && (
          <button className="prayer-add-card-btn" onClick={openAddModal}>
            <span className="plus-icon">+</span>
            Add Prayer Card
          </button>
        )}

        {/* Card List */}
        <div className="cards-list">
          {cards.length === 0 ? (
            <div className="cards-empty-state">
              {activeTab === 'active'
                ? 'No active prayer cards yet. Add one to get started.'
                : 'No answered prayers yet. When God answers, celebrate here!'}
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className={`glass-card prayer-card-item ${card.status === 'answered' ? 'answered' : ''}`}
              >
                <div className="card-item-content">
                  <h3 className="card-item-title">{card.title}</h3>
                  <p className="card-item-date">
                    Prayed since {formatDate(card.dateCreated)}
                  </p>
                  {card.details && (
                    <p className="card-item-details">{card.details}</p>
                  )}
                  {card.status === 'answered' && (
                    <>
                      <p className="card-item-date answered">
                        Answered {card.dateAnswered ? formatDate(card.dateAnswered) : ''}
                      </p>
                      {card.testimony && (
                        <div className="card-item-testimony">
                          <p className="testimony-label">How God Answered:</p>
                          <p className="testimony-text">&ldquo;{card.testimony}&rdquo;</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="card-item-actions">
                  <div className="card-action-icons">
                    {card.status === 'active' && (
                      <button
                        className="card-action-btn edit"
                        onClick={() => openEditModal(card)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="card-action-btn delete"
                      onClick={() => openDeleteModal(card)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  {card.status === 'active' && (
                    <button
                      className="card-answered-full-btn"
                      onClick={() => openAnswerModal(card)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Answered Prayer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {modal.isOpen && (
        <div className="prayer-modal-overlay" onClick={closeModal}>
          <div className="prayer-modal" onClick={(e) => e.stopPropagation()}>
            {/* Add/Edit Modal */}
            {(modal.mode === 'add' || modal.mode === 'edit') && (
              <>
                <h3>{modal.mode === 'add' ? 'Add Prayer Card' : 'Edit Prayer Card'}</h3>
                <div className="modal-field">
                  <label>Who or what are you praying for?</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Mom's health, Job interview"
                    autoFocus
                  />
                </div>
                <div className="modal-field">
                  <label>Details (optional)</label>
                  <textarea
                    value={formDetails}
                    onChange={(e) => setFormDetails(e.target.value)}
                    placeholder="Add any specific details or notes..."
                  />
                </div>
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="modal-btn save"
                    onClick={handleSave}
                    disabled={!formTitle.trim()}
                  >
                    {modal.mode === 'add' ? 'Add Card' : 'Save'}
                  </button>
                </div>
              </>
            )}

            {/* Answer Modal */}
            {modal.mode === 'answer' && modal.card && (
              <>
                <h3>Prayer Answered!</h3>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                  &ldquo;{modal.card.title}&rdquo;
                </p>
                <div className="modal-field">
                  <label>How did God answer? (optional)</label>
                  <textarea
                    value={formTestimony}
                    onChange={(e) => setFormTestimony(e.target.value)}
                    placeholder="Share how God answered this prayer..."
                  />
                </div>
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="modal-btn save" onClick={handleSave}>
                    Celebrate!
                  </button>
                </div>
              </>
            )}

            {/* Delete Modal */}
            {modal.mode === 'delete' && modal.card && (
              <>
                <h3>Delete Card?</h3>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                  &ldquo;{modal.card.title}&rdquo;
                </p>
                <p style={{ textAlign: 'center', color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.9rem' }}>
                  This action cannot be undone.
                </p>
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="modal-btn delete" onClick={handleSave}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
