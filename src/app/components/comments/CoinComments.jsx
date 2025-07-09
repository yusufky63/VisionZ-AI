import { useState, useEffect } from "react";
import { getCoinComments } from "@zoralabs/coins-sdk";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

function CoinComments({ coinAddress }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinAddress]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCoinComments({
        address: coinAddress,
        chain: 8453,
        count: 20,
      });

      if (!response?.data?.zora20Token?.zoraComments) {
        throw new Error("Comment data not found");
      }

      setComments(response.data.zora20Token.zoraComments.edges || []);
    } catch (err) {
      console.error("Error loading comments:", err);
      setError("Error loading comments.");
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={loadComments}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Yorumlar listesi */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => {
            if (!comment.node) return null;
            const { node } = comment;

            return (
              <div
                key={node.txHash}
                className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  {/* Profile Image */}
                  {node.userProfile?.avatar?.previewImage?.small ? (
                    <img
                      src={node.userProfile.avatar.previewImage.small}
                      alt={node.userProfile.handle}
                      className="w-8 h-8 rounded-full border dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {shortenAddress(node.userAddress).substring(0, 2)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    {/* User Information and Date */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {node.userProfile?.handle ||
                          shortenAddress(node.userAddress)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(node.timestamp * 1000), {
                          addSuffix: true,
                          locale: enUS,
                        })}
                      </span>
                    </div>

                    {/* Comment Text */}
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {node.comment}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CoinComments;
