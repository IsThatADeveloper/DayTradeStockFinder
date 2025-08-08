import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Newspaper, DollarSign, Users, AlertCircle } from 'lucide-react';

const FINNHUB_API_KEY = 'ctb750pr01qgsps8iqk0ctb750pr01qgsps8iqkg';

const StockDashboard = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [quote, setQuote] = useState(null);
  const [news, setNews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use a CORS proxy to bypass CORS restrictions
  const fetchWithProxy = async (url) => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return JSON.parse(data.contents);
    } catch (error) {
      // Fallback: try direct request (might work in some environments)
      console.log('Proxy failed, trying direct request...');
      const directResponse = await fetch(url);
      if (!directResponse.ok) throw new Error(`HTTP error! status: ${directResponse.status}`);
      return await directResponse.json();
    }
  };

  // Fetch stock quote
  const fetchQuote = async (stockSymbol) => {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`;
      const data = await fetchWithProxy(url);
      return data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  };

  // Fetch company news
  const fetchNews = async (stockSymbol) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      
      const url = `https://finnhub.io/api/v1/company-news?symbol=${stockSymbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
      const data = await fetchWithProxy(url);
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  };

  // Fetch company profile
  const fetchProfile = async (stockSymbol) => {
    try {
      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`;
      const data = await fetchWithProxy(url);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  // Load all data for a symbol
  const loadStockData = async (stockSymbol) => {
    setLoading(true);
    setError(null);
    
    try {
      // Load quote first as it's most important
      const quoteData = await fetchQuote(stockSymbol);
      setQuote(quoteData);
      
      // Then load profile and news in parallel
      const [profileData, newsData] = await Promise.allSettled([
        fetchProfile(stockSymbol),
        fetchNews(stockSymbol)
      ]);
      
      if (profileData.status === 'fulfilled') {
        setProfile(profileData.value);
      } else {
        console.error('Profile fetch failed:', profileData.reason);
      }
      
      if (newsData.status === 'fulfilled') {
        setNews(newsData.value.slice(0, 10));
      } else {
        console.error('News fetch failed:', newsData.reason);
      }
      
    } catch (error) {
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when symbol changes
  useEffect(() => {
    loadStockData(symbol);
  }, [symbol]);

  const handleSubmit = () => {
    const input = document.querySelector('input[name="symbol"]');
    const newSymbol = input.value.toUpperCase().trim();
    if (newSymbol && newSymbol !== symbol) {
      setSymbol(newSymbol);
    }
  };

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Stock Data Dashboard</h1>
        
        {/* Search Input */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              name="symbol"
              placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={symbol}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>

        {/* CORS Notice */}
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">CORS Proxy Notice</p>
              <p className="text-sm">Using AllOrigins proxy to bypass CORS. For production, implement a backend proxy or use Finnhub's WebSocket API.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-1">Try refreshing or check if the stock symbol is valid.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading stock data...</span>
          </div>
        </div>
      )}

      {/* Stock Quote Card */}
      {quote && quote.c && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{symbol}</h2>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-500">Live Price</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Current Price</p>
              <p className="text-2xl font-bold text-gray-900">${quote.c?.toFixed(2)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Change</p>
              <div className="flex items-center gap-1">
                {(quote.d || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-lg font-semibold ${(quote.d || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(quote.d || 0).toFixed(2)} ({(quote.dp || 0).toFixed(2)}%)
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">High</p>
              <p className="text-lg font-semibold text-gray-900">${quote.h?.toFixed(2) || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Low</p>
              <p className="text-lg font-semibold text-gray-900">${quote.l?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Profile & Free Float */}
      {profile && profile.name && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Company Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Company Name</p>
              <p className="font-semibold text-gray-900">{profile.name || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Market Cap</p>
              <p className="font-semibold text-gray-900">${formatNumber(profile.marketCapitalization)}M</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Shares Outstanding</p>
              <p className="font-semibold text-gray-900">{formatNumber(profile.shareOutstanding)}M</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Free Float</p>
              <p className="font-semibold text-gray-900">{formatNumber(profile.freeFloat)}M</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Industry</p>
              <p className="font-semibold text-gray-900">{profile.finnhubIndustry || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Country</p>
              <p className="font-semibold text-gray-900">{profile.country || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* News Section */}
      {news && news.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900">Recent News</h3>
          </div>
          
          <div className="space-y-4">
            {news.map((article, index) => (
              <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {article.headline}
                      </a>
                    </h4>
                    {article.summary && (
                      <p className="text-gray-600 text-sm mb-2">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Source: {article.source}</span>
                      <span>Published: {formatDate(article.datetime)}</span>
                    </div>
                  </div>
                  
                  {article.image && (
                    <img 
                      src={article.image} 
                      alt={article.headline}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !quote && !error && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Try searching for a different stock symbol or check your internet connection.</p>
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Data provided by Finnhub • Using CORS proxy for browser compatibility
      </div>
    </div>
  );
};

export default StockDashboard;