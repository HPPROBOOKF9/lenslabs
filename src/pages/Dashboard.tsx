import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "@/components/AdminCard";
import { StatCard } from "@/components/StatCard";
import { ActionCard } from "@/components/ActionCard";
import { Card } from "@/components/ui/card";
import SignOutButton from "@/components/SignOutButton";
import { 
  Plus, 
  Briefcase, 
  Star, 
  FileEdit, 
  ImagePlus, 
  Eye, 
  CheckCircle, 
  TrendingUp,
  Trash2,
  Menu
} from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
  const [selectedAdmin, setSelectedAdmin] = useState("AD1");

  const { data: admins } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admins").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: listings, error } = await supabase.from("listings").select("*");
      if (error) throw error;

      const { data: categories, error: catError } = await supabase.from("categories").select("*");
      if (catError) throw catError;

      const statusCounts = {
        cpv: listings.filter(l => l.status === "cpv").length,
        nr: listings.filter(l => l.status === "nr").length,
        pr: listings.filter(l => l.status === "pr").length,
        np: listings.filter(l => l.status === "np").length,
        assign: listings.filter(l => l.status === "assign").length,
      };

      return {
        listed: listings.length,
        categories: categories.length,
        ...statusCounts,
      };
    },
  });

  const { data: adminWorkloads } = useQuery({
    queryKey: ["admin-workloads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("assigned_to")
        .in("status", ["worklist"]);
      
      if (error) throw error;

      const workloads = admins?.map(admin => ({
        adminCode: admin.admin_code,
        count: data.filter(l => l.assigned_to === admin.id).length,
      })) || [];

      return workloads;
    },
    enabled: !!admins,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-muted-foreground" />
            </button>
            <h1 className="text-3xl font-bold">Product Management Dashboard</h1>
          </div>
          <SignOutButton />
        </div>

        {/* Admin Cards */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {admins?.map((admin) => {
            const workload = adminWorkloads?.find(w => w.adminCode === admin.admin_code);
            return (
              <AdminCard
                key={admin.id}
                adminCode={admin.admin_code}
                pendingCount={workload?.count || 0}
                isActive={selectedAdmin === admin.admin_code}
              />
            );
          })}
        </div>

        {/* Statistics */}
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-6">
            <StatCard label="Listed" value={stats?.listed || 0} sublabel="LISTED" />
            <StatCard label="Category" value={stats?.categories || 0} sublabel="MUSLEY" />
            <StatCard label="CPV" value={stats?.cpv || 0} sublabel="NR" />
            <StatCard label="NR" value={stats?.nr || 0} sublabel="PR" />
            <StatCard label="PR" value={stats?.pr || 0} sublabel="NP" />
            <StatCard label="NP" value={stats?.np || 0} sublabel="NP" />
            <StatCard label="IA" value={stats?.assign || 0} sublabel="IA" />
          </div>
        </Card>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <ActionCard icon={Plus} label="CREATE NEW" to="/create-new" />
          <ActionCard icon={Briefcase} label="ASSIGN" to="/assign" />
          <ActionCard icon={Star} label="WORK LIST" to="/worklist" />
          <ActionCard icon={FileEdit} label="DRAFT" to="/draft" />
          <ActionCard icon={ImagePlus} label="CPV" to="/cpv" />
          <ActionCard icon={Eye} label="NR" to="/nr" />
          <ActionCard icon={CheckCircle} label="PR" to="/pr" />
          <ActionCard icon={TrendingUp} label="TREND ANALYSIS" to="/trend-analysis" />
          <ActionCard icon={Trash2} label="DELETED LISTINGS" to="/deleted-listings" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
