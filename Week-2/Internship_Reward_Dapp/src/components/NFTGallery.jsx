import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

function NFTGallery({ selectedIntern }) {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNFTs();
    }, [selectedIntern]);

    const fetchNFTs = async () => {
        setLoading(true);
        try {
            // Fetch completed tasks (these represent NFTs earned)
            let response;
            if (selectedIntern) {
                response = await taskAPI.getByIntern(selectedIntern, { status: 'Approved' });
            } else {
                response = await taskAPI.getAll({ status: 'Approved' });
            }

            // Convert approved tasks to NFTs
            const nftData = (response.data || []).map(task => ({
                id: task._id,
                name: task.title,
                description: task.description,
                internName: task.internName,
                score: task.score,
                mintedDate: task.updatedAt,
                achievementType: 'Task Completion',
            }));

            setNfts(nftData);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradient = (index) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div className="container fade-in">
            <h1>🏆 NFT Gallery</h1>
            <p className="text-secondary mb-lg">
                Collection of earned NFT achievement certificates
            </p>

            {loading ? (
                <div className="loading text-center" style={{ padding: '4rem' }}>
                    <h3>Loading NFTs...</h3>
                </div>
            ) : nfts.length > 0 ? (
                <div className="grid grid-3">
                    {nfts.map((nft, index) => (
                        <div
                            key={nft.id}
                            className="card"
                            style={{
                                background: getGradient(index),
                                border: 'none',
                                color: 'white',
                            }}
                        >
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                padding: 'var(--spacing-lg)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <div className="flex justify-between items-center mb-md">
                                    <span className="badge" style={{
                                        background: 'rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                    }}>
                                        {nft.achievementType}
                                    </span>
                                    {nft.score && (
                                        <div style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                        }}>
                                            {nft.score}/100
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ color: 'white', marginBottom: 'var(--spacing-sm)' }}>
                                    {nft.name}
                                </h3>

                                {nft.description && (
                                    <p style={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontSize: '0.875rem',
                                        marginBottom: 'var(--spacing-md)',
                                    }}>
                                        {nft.description}
                                    </p>
                                )}

                                <div style={{
                                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                                    paddingTop: 'var(--spacing-sm)',
                                    marginTop: 'var(--spacing-md)',
                                }}>
                                    <div className="flex justify-between" style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                    }}>
                                        <span>👤 {nft.internName}</span>
                                        <span>📅 {new Date(nft.mintedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center" style={{ padding: '4rem' }}>
                    <h3 className="text-muted">No NFTs earned yet</h3>
                    <p className="text-secondary">Complete and get approved tasks to earn NFT certificates</p>
                </div>
            )}

            {/* Info Card */}
            <div className="card mt-xl" style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                border: 'none',
                color: 'white',
            }}>
                <h3 style={{ color: 'white' }}>🎓 About NFT Rewards</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Each approved task earns you a unique NFT certificate. These represent your achievements
                    and skills developed during the internship. In the future, these will be minted on the
                    blockchain and can be showcased in your professional portfolio.
                </p>
                <div className="grid grid-3 mt-md">
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>
                            {nfts.length}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            Total NFTs
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>
                            {nfts.length > 0 ? Math.round(nfts.reduce((sum, nft) => sum + (nft.score || 0), 0) / nfts.length) : 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            Avg Score
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>
                            🔗
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            Blockchain Ready
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NFTGallery;
