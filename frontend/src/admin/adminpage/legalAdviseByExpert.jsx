// Admin page to view all client consultation requests
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axiosConfig';
import { toast } from 'react-hot-toast';
import Navbar from "../../common/Navbar";
import Footer from '../../common/Footer';
import { Appcontext } from '../../lib/Appcontext';


const LegalAdviseByExpert = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { backendUrl, userData, loading: appLoading } = useContext(Appcontext);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Track mount state
    isMountedRef.current = true;

    if (appLoading) return; // wait until Appcontext is ready

    // Redirect if user is not admin
    if (userData && userData.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/login', { replace: true });
      return;
    }

    // Only fetch if admin
    if (userData?.role === 'admin') {
      const fetchConversations = async () => {
        try {
          // Fetch all conversations where admin is a participant
          const res = await axios.get(
            `${backendUrl}/api/chat/conversations`,
            { withCredentials: true }
          );
          if (!isMountedRef.current) return;

          const allConvs = Array.isArray(res.data) ? res.data : [];
          console.log('Admin conversations fetched:', allConvs);
          if (isMountedRef.current) setConversations(allConvs);
        } catch (error) {
          console.error('Failed to fetch conversations:', error);
          if (isMountedRef.current) toast.error('Failed to load consultations');
        } finally {
          if (isMountedRef.current) setLoading(false);
        }
      };

      fetchConversations();
    }

    return () => { 
      isMountedRef.current = false;
    };
  }, [appLoading, userData, navigate, backendUrl]);

  const getOtherParticipant = (conv) => {
    if (!conv.participants || !Array.isArray(conv.participants)) return null;
    return conv.participants.find(p => p._id !== userData?._id);
  };

  const getProfilePicUrl = (person) => {
    if (!person || !person.profilePic) return '';
    const pic = person.profilePic;
    if (pic.path) return `${backendUrl}/${pic.path}`;
    if (pic.filename) return `${backendUrl}/uploads/profilePics/${pic.filename}`;
    return '';
  };

  const handleOpenChat = (conv) => {
    navigate(`/admin/consultation-chat/${conv._id}`);
  };

  if (loading || appLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brownBG via-brown to-brownforhover flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brownBG via-brown to-brownforhover flex flex-col">
      <Navbar/>
      
      <div className="flex-1 p-6 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-brownBG mb-2">
                Client Consultations
              </h1>
              <p className="text-browntextcolor">
                Manage and respond to client legal consultation requests
              </p>
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-brownBG mb-2">
                  No Consultations Yet
                </h3>
                <p className="text-browntextcolor">
                  Client consultation requests will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map(conv => {
                  const client = getOtherParticipant(conv);
                  const profilePic = getProfilePicUrl(client);

                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleOpenChat(conv)}
                      className="bg-gradient-to-r from-amber-50 to-white border-2 border-brown/20 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-4">
                        {/* Client Avatar */}
                        {profilePic ? (
                          <img
                            src={profilePic}
                            alt={client?.userName || 'Client'}
                            className="w-16 h-16 rounded-full object-cover border-3 border-brown shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brown to-brownforhover flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {client?.userName?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}

                        {/* Client Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-brownBG">
                            {client?.userName || 'Unknown Client'}
                          </h3>
                          <p className="text-sm text-browntextcolor">
                            {client?.email || 'No email'}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-browntextcolor mt-1 line-clamp-1">
                              Last message: {new Date(conv.updatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(conv);
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-brown to-brownforhover text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                        >
                          Open Chat →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer/>
    </div>
  );
};

export default LegalAdviseByExpert;