import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  Heart,
  ShoppingBag,
  ChevronRight,
  User,
  MapPin,
} from 'lucide-react';
import { orderService, wishlistService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { totalItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [ordersRes, wishlistRes] = await Promise.allSettled([
          orderService.getMyOrders(),
          wishlistService.getWishlist(),
        ]);
        if (!isMounted) return;

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
          setOrders(ordersRes.value.data.orders || []);
        }
        if (wishlistRes.status === 'fulfilled' && wishlistRes.value.data.success) {
          setWishlistCount(wishlistRes.value.data.wishlist?.products?.length || 0);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) =>
    ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)
  ).length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const totalSpent = orders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const recentOrders = orders.slice(0, 4);

  const kpis = [
    { label: 'Total Orders', value: totalOrders, icon: Package, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'In Progress', value: pendingOrders, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Delivered', value: deliveredOrders, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Wishlist Items', value: wishlistCount, icon: Heart, bg: 'bg-rose-50', text: 'text-rose-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Hello, {user?.name?.split(' ')[0] || 'Shopper'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Here is a live snapshot of your MegaBasket account activity.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop Fresh Groceries</span>
        </Link>
      </div>

      {loading ? (
        <SkeletonLoader type="table" count={3} />
      ) : (
        <>
          {/* KPI Cards - real MongoDB data */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {kpi.label}
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{kpi.value}</h3>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${kpi.bg} ${kpi.text} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/orders" className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3">
              <Package className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">My Orders</span>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/cart" className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                Cart ({totalItems})
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/addresses" className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Addresses</span>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/profile" className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3">
              <User className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Account Settings</span>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Recent Orders + Spend Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
                <Link to="/orders" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                  View All &rarr;
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500 italic">
                  No orders yet. Your first fresh grocery order is one click away!
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      to={`/orders/${order._id}`}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          #{order.orderNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={order.orderStatus} />
                        <span className="text-xs font-bold text-slate-900">₹{order.totalAmount}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Account Summary
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total Spent (COD)</span>
                  <span className="font-bold text-slate-900">₹{totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Items in Cart</span>
                  <span className="font-bold text-slate-900">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Saved Wishlist Items</span>
                  <span className="font-bold text-slate-900">{wishlistCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Member Email</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">{user?.email}</span>
                </div>
              </div>
              <Link
                to="/wishlist"
                className="block text-center py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
              >
                View My Wishlist
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
