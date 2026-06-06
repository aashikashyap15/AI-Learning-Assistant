import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Sparkles,
  Brain,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import flashcardService from "../../../services/flashcardService";
import aiService from "../../../services/aiService";
import Spinner from "../Spinner";
import Modal from "../Modal";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getFlashcardsForDocument(
        documentId
      );
      setFlashcardSets(response.data);
    } catch (error) {
      toast.error("Failed to fetch flashcard sets.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchFlashcardSets();
    }
  }, [documentId]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  // ⭐ Flashcard Review
  const handleReview = async (index) => {
  try {
    const card = selectedSet?.cards[index];
    if (!card) return;

    await flashcardService.reviewFlashcard(card._id, index);

    
  } catch (error) {
    console.error("Review error:", error);
  }
};

  const handleNextCard = async () => {
  if (!selectedSet || !selectedSet.cards?.length) return;

  await handleReview(currentCardIndex);

  setCurrentCardIndex(
    (prevIndex) => (prevIndex + 1) % selectedSet.cards.length
  );
};

  const handlePrevCard = async () => {
  if (!selectedSet || !selectedSet.cards?.length) return;

  await handleReview(currentCardIndex);

  setCurrentCardIndex(
    (prevIndex) =>
      (prevIndex - 1 + selectedSet.cards.length) %
      selectedSet.cards.length
  );
};

  // ⭐ Toggle Star
  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);

      setFlashcardSets((prevSets) =>
        prevSets.map((set) => ({
          ...set,
          cards: set.cards.map((card) =>
            card._id === cardId
              ? { ...card, isStarred: !card.isStarred }
              : card
          ),
        }))
      );

      setSelectedSet((prev) =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map((card) =>
                card._id === cardId
                  ? { ...card, isStarred: !card.isStarred }
                  : card
              ),
            }
          : prev
      );

      toast.success("Flashcard starred status updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to toggle star.");
    }
  };

  const handleDeleteRequest = (e, set) => {
    e.stopPropagation();
    setSetToDelete(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;

    setDeleting(true);

    try {
      await flashcardService.deleteFlashcardSet(setToDelete._id);

      toast.success("Flashcard set deleted successfully");

      setFlashcardSets((prevSets) =>
        prevSets.filter((set) => set._id !== setToDelete._id)
      );

      setSetToDelete(null);
      setIsDeleteModalOpen(false);
      setSelectedSet(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
  };

  const renderFlashcardViewer = () => {
    if (!selectedSet || !selectedSet.cards?.length) {
      return <p className="text-slate-500">No cards available.</p>;
    }

    const currentCard = selectedSet.cards[currentCardIndex];

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedSet(null)}
          className="flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sets
        </button>

        <Flashcard
          flashcard={currentCard}
          onToggleStar={handleToggleStar}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevCard}
            className="p-3 rounded-xl bg-slate-100"
          >
            <ChevronLeft />
          </button>

          <span className="text-sm text-slate-500">
            {currentCardIndex + 1} / {selectedSet.cards.length}
          </span>

          <button
            onClick={handleNextCard}
            className="p-3 rounded-xl bg-slate-100"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    );
  };

  const renderSetList = () => {
    return (
      <div className="space-y-4">
        {flashcardSets.map((set) => (
          <div
            key={set._id}
            onClick={() => handleSelectSet(set)}
            className="p-4 border rounded-xl cursor-pointer hover:bg-slate-50 flex justify-between"
          >
            <div>
              <h4 className="font-semibold">{set.title || "Flashcard Set"}</h4>
              <p className="text-sm text-slate-500">
                {set.cards?.length || 0} cards •{" "}
                {moment(set.createdAt).fromNow()}
              </p>
            </div>

            <button
              onClick={(e) => handleDeleteRequest(e, set)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Flashcards
        </h2>

        <button
          onClick={handleGenerateFlashcards}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl"
        >
          <Sparkles className="w-4 h-4" />
          Generate
        </button>
      </div>

      {selectedSet ? renderFlashcardViewer() : renderSetList()}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Flashcard Set"
      >
        <p className="mb-4">Are you sure you want to delete this set?</p>

        <button
          onClick={handleConfirmDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </Modal>
    </div>
  );
};

export default FlashcardManager;