import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const UserRoleManager = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["all-users-roles"],
        queryFn: async () => {
            const { data: profiles, error: pError } = await supabase
                .from("profiles")
                .select("*");

            if (pError) throw pError;

            const { data: roles, error: rError } = await supabase
                .from("user_roles")
                .select("*");

            if (rError) throw rError;

            return profiles.map(p => ({
                ...p,
                roles: roles.filter(r => r.user_id === p.id).map(r => r.role)
            }));
        }
    });

    const handleRoleChange = async (userId: string, newRole: string, currentRoles: string[]) => {
        try {
            // For simplicity, we just manage one main role here
            // 1. Remove current roles
            await supabase.from("user_roles").delete().eq("user_id", userId);

            // 2. Add new role
            const { error } = await supabase.from("user_roles").insert({
                user_id: userId,
                role: newRole as any
            });

            if (error) throw error;

            toast({ title: "Cargo atualizado!", description: "As permissões do usuário foram alteradas." });
            queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
            queryClient.invalidateQueries({ queryKey: ["profissionais"] });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const filteredUsers = users.filter(u =>
        u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <p>Carregando usuários...</p>;

    return (
        <div className="w-full space-y-4 text-left">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou e-mail..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Cargo Atual</TableHead>
                            <TableHead className="text-right">Alterar Para</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((u) => {
                            const currentRole = u.roles[0] || "Sem cargo";
                            return (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="font-medium">{u.nome || "Sem nome"}</div>
                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={currentRole === 'admin' ? 'default' : currentRole === 'profissional' ? 'secondary' : 'outline'}>
                                            {currentRole}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select
                                            onValueChange={(val) => handleRoleChange(u.id, val, u.roles)}
                                            defaultValue={currentRole}
                                        >
                                            <SelectTrigger className="w-[140px] ml-auto">
                                                <SelectValue placeholder="Mudar cargo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paciente">Paciente</SelectItem>
                                                <SelectItem value="profissional">Profissional</SelectItem>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UserRoleManager;
