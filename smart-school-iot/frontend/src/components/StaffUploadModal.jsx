import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Check, AlertCircle, RefreshCw, MapPin, Clock, ShieldCheck, SwitchCamera, VideoOff } from 'lucide-react';
import { schoolService } from '../services/api';

export const StaffUploadModal = ({ isOpen, onClose, onUploadSuccess, schoolName }) => {
  const [category, setCategory] = useState('MEAL_PREPARATION');
  const [mealType, setMealType] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [staffName, setStaffName] = useState('');
  const [inspectionShift, setInspectionShift] = useState('Morning Prep');
  const [hygieneNotes, setHygieneNotes] = useState('');

  // Camera & Capture State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  
  // Geolocation State
  const [locationData, setLocationData] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    text: 'Acquiring GPS coordinates...',
    isLoaded: false
  });

  // Captured Photo State (Blob and Preview)
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [capturedMeta, setCapturedMeta] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Geolocation when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const acc = Math.round(position.coords.accuracy);
          setLocationData({
            latitude: lat,
            longitude: lon,
            accuracy: acc,
            text: `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E (±${acc}m)`,
            isLoaded: true
          });
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
          // Fallback location description based on school
          setLocationData({
            latitude: 16.4674,
            longitude: 80.7098,
            accuracy: null,
            text: `16.4674° N, 80.7098° E (ZPHS Penamaluru Node)`,
            isLoaded: true
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationData({
        latitude: 16.4674,
        longitude: 80.7098,
        accuracy: null,
        text: `16.4674° N, 80.7098° E (Fixed Institutional Node)`,
        isLoaded: true
      });
    }
  }, [isOpen]);

  // Start Camera Stream
  const startCamera = async (facing = facingMode) => {
    setCameraError('');
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      // Try fallback to any available video device
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (fallbackErr) {
        setCameraActive(false);
        setCameraError(
          'Unable to access camera. Please allow camera permissions in your browser address bar to capture photos.'
        );
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Open camera when modal opens
  useEffect(() => {
    if (isOpen && !previewUrl) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, previewUrl]);

  // Toggle Camera Front/Back
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture Photo and Burn Timestamp & Location into Canvas Pixels
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Draw raw camera frame
    ctx.drawImage(video, 0, 0, width, height);

    // 2. Prepare timestamp and location strings
    const now = new Date();
    const timestampStr = now.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
      hour12: true
    });
    const isoTimestamp = now.toISOString();

    const locString = locationData.text || 'Location: ZPHS Penamaluru (Node SCH-PENAMALURU-001)';
    const nodeLabel = schoolName || 'ZPHS Penamaluru';
    const categoryLabel =
      category === 'MEAL_PREPARATION' ? '🥘 MEAL PREPARATION'
      : category === 'KITCHEN_HYGIENE' ? '🧼 KITCHEN HYGIENE'
      : '👥 STUDENT MEAL ATTENDANCE';
    const shiftLabel = inspectionShift || 'Inspection Shift';
    const staffLabel = staffName ? `Staff: ${staffName}` : 'Mid-Day Meal Staff';

    // 3. Burn Security & Compliance Watermark Banner at the bottom of the image
    const bannerHeight = Math.max(90, Math.round(height * 0.16));
    const bannerY = height - bannerHeight;

    // Gradient translucent background banner
    const gradient = ctx.createLinearGradient(0, bannerY, 0, height);
    gradient.addColorStop(0, 'rgba(11, 17, 32, 0.88)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 0.96)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, bannerY, width, bannerHeight);

    // Accent line separator (Teal)
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(0, bannerY, width, 4);

    // Subtle drop shadow for text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Font scaling based on canvas resolution
    const baseFontSize = Math.max(12, Math.round(height * 0.024));
    ctx.font = `bold ${baseFontSize}px 'Inter', sans-serif`;

    // Row 1: Location & School Node
    ctx.fillStyle = '#38bdf8'; // Sky blue
    ctx.fillText(`📍 LOCATION: ${locString}  |  🏫 ${nodeLabel}`, 20, bannerY + baseFontSize + 12);

    // Row 2: Timestamp (Yellow/Gold)
    ctx.fillStyle = '#facc15';
    ctx.fillText(`🕒 CAPTURE TIME: ${timestampStr}`, 20, bannerY + (baseFontSize * 2) + 18);

    // Row 3: Category, Shift & Staff (Emerald/White)
    ctx.fillStyle = '#ffffff';
    ctx.font = `500 ${Math.max(11, baseFontSize - 2)}px 'Inter', sans-serif`;
    ctx.fillText(`🏷️ ${categoryLabel}  •  ${shiftLabel}  •  ${staffLabel}`, 20, bannerY + (baseFontSize * 3) + 24);

    // Right-aligned verification badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2dd4bf';
    ctx.font = `bold ${Math.max(11, baseFontSize - 2)}px 'Inter', sans-serif`;
    ctx.fillText('GOVT OF ANDHRA PRADESH', width - 20, bannerY + baseFontSize + 12);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `400 ${Math.max(10, baseFontSize - 4)}px 'Inter', sans-serif`;
    ctx.fillText('SmartSchoolIoT Verified In-App Capture', width - 20, bannerY + (baseFontSize * 2) + 18);

    // Reset textAlign & shadow
    ctx.textAlign = 'left';
    ctx.shadowColor = 'transparent';

    // 4. Convert stamped canvas to Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const preview = URL.createObjectURL(blob);
          setPreviewUrl(preview);
          setCapturedMeta({
            timestamp: timestampStr,
            isoTimestamp: isoTimestamp,
            location: locString,
            latitude: locationData.latitude,
            longitude: locationData.longitude
          });
          stopCamera();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Retake Photo
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedBlob(null);
    setCapturedMeta(null);
    startCamera(facingMode);
  };

  // Submit the stamped photo to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capturedBlob) {
      setErrorMsg('Please capture a photo using the live camera before submitting.');
      return;
    }
    if (!staffName.trim()) {
      setErrorMsg('Please enter Cook / Staff Name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', capturedBlob, `camera_capture_${Date.now()}.jpg`);
      formData.append('category', category);
      formData.append('meal_type', mealType || 'Daily Mid-Day Meal');
      formData.append('menu_description', menuDescription);
      formData.append('staff_name', staffName);
      formData.append('inspection_shift', inspectionShift);
      formData.append('hygiene_notes', hygieneNotes);

      if (capturedMeta) {
        if (capturedMeta.latitude) formData.append('latitude', capturedMeta.latitude);
        if (capturedMeta.longitude) formData.append('longitude', capturedMeta.longitude);
        if (capturedMeta.location) formData.append('captured_location', capturedMeta.location);
        if (capturedMeta.timestamp) formData.append('captured_timestamp', capturedMeta.timestamp);
      }

      await schoolService.uploadImage(formData);
      setSuccessMsg('Live captured photo submitted successfully with verified timestamp and location!');

      setTimeout(() => {
        setIsSubmitting(false);
        handleRetake();
        setMealType('');
        setMenuDescription('');
        setHygieneNotes('');
        setSuccessMsg('');
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      }, 1600);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit captured photo. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedBlob(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Staff Photo Capture</h3>
              <p className="text-[11px] text-teal-400 font-medium">
                Live in-app camera capture only • GPS & Timestamp stamped on photo
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submission Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Inspection Category <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('MEAL_PREPARATION')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  category === 'MEAL_PREPARATION'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🥘</span>
                <span>Meal Prep</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('KITCHEN_HYGIENE')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  category === 'KITCHEN_HYGIENE'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🧼</span>
                <span>Kitchen Hygiene</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('STUDENT_EATING')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  category === 'STUDENT_EATING'
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-base">👥</span>
                <span>Students Eating</span>
              </button>
            </div>
            {category === 'STUDENT_EATING' && (
              <p className="mt-2 text-[11px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5 flex items-center space-x-1.5">
                <span>🤖</span>
                <span>CV will auto-count students from this image using AI person detection</span>
              </p>
            )}
            {category === 'MEAL_PREPARATION' && (
              <p className="mt-2 text-[11px] text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-1.5 flex items-center space-x-1.5">
                <span>🤖</span>
                <span>CV will auto-compare food image to menu before admin review</span>
              </p>
            )}
          </div>

          {/* Live Camera Viewfinder or Stamped Photo Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-teal-400" />
                <span>Camera Viewfinder (Direct Capture Only)</span>
              </label>

              {/* GPS indicator pill */}
              <div className="flex items-center space-x-1 text-[11px] text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="font-mono truncate max-w-[220px]">{locationData.text}</span>
              </div>
            </div>

            {/* Viewfinder Window */}
            <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
              
              {/* If preview exists: show captured stamped photo */}
              {previewUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={previewUrl}
                    alt="Captured Stamped Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-slate-950 text-xs font-bold shadow-md flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Photo Stamped & Ready</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 shadow-md flex items-center space-x-1 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                    <span>Retake Photo</span>
                  </button>
                </div>
              ) : cameraActive ? (
                /* Live Video Stream View */
                <div className="relative w-full h-full bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Live viewfinder hud overlay */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-teal-300 font-mono flex items-center space-x-1.5 border border-teal-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE CAMERA FEED</span>
                  </div>

                  {/* Flip camera button */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border border-slate-700 transition-colors shadow-md"
                    title="Switch Front/Rear Camera"
                  >
                    <SwitchCamera className="w-4 h-4 text-teal-400" />
                  </button>

                  {/* Live watermark target preview bar at bottom of viewfinder */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm p-2.5 text-left border-t border-teal-500/30 flex items-center justify-between">
                    <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
                      <p className="flex items-center text-teal-400">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>GPS: {locationData.text}</span>
                      </p>
                      <p className="flex items-center text-amber-300">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Auto-stamps exact date, time & location</span>
                      </p>
                    </div>

                    {/* Prominent Capture Button */}
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/30 flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Camera Inactive / Permission Error / Loading */
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                    <VideoOff className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      {cameraError || 'Camera Access Required'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Direct in-app capture only. External photo uploads are disabled for tamper-evident compliance.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Activate Camera</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cook / Staff Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. S. Lakshmi Devi"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Inspection Shift
              </label>
              <select
                value={inspectionShift}
                onChange={(e) => setInspectionShift(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="Morning Prep">Morning Prep (8:00 AM - 11:00 AM)</option>
                <option value="Lunch Serving">Lunch Serving (12:00 PM - 2:00 PM)</option>
                <option value="Sanitation Review">Sanitation & Kitchen Cleaning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meal Menu / Item
              </label>
              <input
                type="text"
                placeholder="e.g. Rice, Sambar, Egg"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Menu / Preparation Description
              </label>
              <input
                type="text"
                placeholder="Fresh ingredients, clean drinking water used"
                value={menuDescription}
                onChange={(e) => setMenuDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hygiene & Cleanliness Observation Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cooking area sanitized, staff wearing aprons and hairnets, filtered water used."
              value={hygieneNotes}
              onChange={(e) => setHygieneNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 placeholder-slate-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">
              {capturedBlob ? '✓ Image captured and stamped' : 'Camera capture required'}
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !capturedBlob}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Verified Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
