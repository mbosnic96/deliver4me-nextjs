import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import User from "@/lib/models/User";
import Load from "@/lib/models/Load";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month dates
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    // Last month dates
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);

    // Get all data in parallel
    const [
      currentMonthLoads,
      currentMonthUsers,
      lastMonthLoads,
      lastMonthUsers,
      allDeliveredLoads, // Only delivered loads for revenue
      allLoads, // All loads for counts
      totalUsers,
      activeLoads,
      completedLoads
    ] = await Promise.all([
      // Current month loads (all statuses for counts)
      Load.find({
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
      }),
      
      // Current month users
      User.find({
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
      }),
      
      // Last month loads (all statuses for counts)
      Load.find({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      }),
      
      // Last month users
      User.find({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      }),
      
      // Only delivered loads for revenue calculation
      Load.find({ status: "Dostavljen" }),
      
      // All loads for general counts
      Load.find({}),
      
      // Total users
      User.countDocuments(),
      
      // Active loads
      Load.countDocuments({ status: "Aktivan" }),
      
      // Completed loads
      Load.countDocuments({ status: "Dostavljen" })
    ]);

    // Calculate revenue - 2% of delivered loads
    const calculateRevenue = (loads: any[]) => {
      return loads.reduce((sum, load) => {
        const loadPrice = load.fixedPrice || 0;
        const platformRevenue = loadPrice * 0.05; // 2% platform fee
        return sum + platformRevenue;
      }, 0);
    };

    // Current month revenue (only from delivered loads in current month)
    const currentMonthDeliveredLoads = allDeliveredLoads.filter(load => {
      const loadDate = new Date(load.createdAt);
      return loadDate >= currentMonthStart && loadDate <= currentMonthEnd;
    });
    
    const monthlyRevenue = calculateRevenue(currentMonthDeliveredLoads);

    // Last month revenue (only from delivered loads in last month)
    const lastMonthDeliveredLoads = allDeliveredLoads.filter(load => {
      const loadDate = new Date(load.createdAt);
      return loadDate >= lastMonthStart && loadDate <= lastMonthEnd;
    });
    
    const lastMonthRevenue = calculateRevenue(lastMonthDeliveredLoads);

    // Total revenue (from all delivered loads)
    const totalRevenue = calculateRevenue(allDeliveredLoads);

    // Calculate growth percentages
    const userGrowth = lastMonthUsers.length > 0 
      ? ((currentMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100 
      : currentMonthUsers.length > 0 ? 100 : 0;

    const loadGrowth = lastMonthLoads.length > 0 
      ? ((currentMonthLoads.length - lastMonthLoads.length) / lastMonthLoads.length) * 100 
      : currentMonthLoads.length > 0 ? 100 : 0;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthlyRevenue > 0 ? 100 : 0;

    // Additional statistics for better insights
    const deliveredLoadsThisMonth = currentMonthLoads.filter(load => load.status === "Dostavljen").length;
    const totalDeliveredLoadsValue = allDeliveredLoads.reduce((sum, load) => sum + (load.fixedPrice || 0), 0);

    return NextResponse.json({
      // Revenue statistics
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimal places
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth),
      
      // User statistics
      newUsersThisMonth: currentMonthUsers.length,
      userGrowth: Math.round(userGrowth),
      totalUsers,
      
      // Load statistics
      loadsThisMonth: currentMonthLoads.length,
      loadGrowth: Math.round(loadGrowth),
      activeLoads,
      completedLoads,
      deliveredLoadsThisMonth,
      
      // Additional insights
      totalDeliveredLoads: allDeliveredLoads.length,
      totalDeliveredLoadsValue: Math.round(totalDeliveredLoadsValue * 100) / 100,
      platformFeePercentage: 2,
      
      // Raw counts for reference
      currentMonthLoadsCount: currentMonthLoads.length,
      lastMonthLoadsCount: lastMonthLoads.length,
      currentMonthDeliveredCount: currentMonthDeliveredLoads.length,
      lastMonthDeliveredCount: lastMonthDeliveredLoads.length
    });

  } catch (error: any) {
    console.error("Failed to fetch statistics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}