"use client";

import { useState, useEffect } from "react";
import { Navbar1 } from "@/components/home-navbar";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/user-profile-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { Search, UserPlus, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Friend {
    id: string;
    friend: {
        id: string;
        name: string;
        username: string | null;
        avatar?: {
            id: string;
            name: string;
            imageUrl: string;
        } | null;
        avatarBorderColor?: string | null;
        totalCO2Saved: number;
    };
    status: string;
    createdAt: string;
}

interface User {
    id: string;
    name: string;
    username: string | null;
    avatar?: {
        id: string;
        name: string;
        imageUrl: string;
    } | null;
    avatarBorderColor?: string | null;
    totalCO2Saved: number;
}

export default function SocialPage() {
    const { session } = useAuth();
    const { profile } = useUserProfile();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchFriends();
            fetchPendingRequests();
        }
    }, [session]);

    const fetchFriends = async () => {
        try {
            const response = await fetch("/api/friends?status=accepted");
            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (error) {
            console.error("Failed to fetch friends:", error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch("/api/friends?status=pending");
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch pending requests:", error);
        }
    };

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Failed to search users:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const sendFriendRequest = async (userId: string) => {
        try {
            const response = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: userId }),
            });

            if (response.ok) {
                toast.success("Demande d'ami envoyée");
                setSearchResults([]);
                setSearchQuery("");
            } else {
                const error = await response.json();
                toast.error(error.error || "Erreur lors de l'envoi de la demande");
            }
        } catch (error) {
            console.error("Failed to send friend request:", error);
            toast.error("Erreur lors de l'envoi de la demande");
        }
    };

    const respondToRequest = async (friendshipId: string, action: "accept" | "reject") => {
        try {
            const response = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendshipId, action }),
            });

            if (response.ok) {
                toast.success(action === "accept" ? "Ami ajouté" : "Demande refusée");
                fetchFriends();
                fetchPendingRequests();
            } else {
                toast.error("Erreur lors du traitement de la demande");
            }
        } catch (error) {
            console.error("Failed to respond to request:", error);
            toast.error("Erreur lors du traitement de la demande");
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Background Image */}
            <div
                className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat brightness-75 dark:brightness-50"
                style={{
                    backgroundImage: "url('/images/app-background.jpg')",
                }}
            />

            {/* Frosted Glass Overlay */}
            <div className="fixed inset-0 -z-10 backdrop-blur-md dark:bg-black/30" />

            <div className="relative">
                <Navbar1 />

                <div className="container mx-auto px-4 py-8">
                    <Tabs defaultValue="friends" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                            <TabsTrigger value="friends">
                                <Users className="h-4 w-4 mr-2" />
                                Amis ({friends.length})
                            </TabsTrigger>
                            <TabsTrigger value="requests">
                                <Clock className="h-4 w-4 mr-2" />
                                Demandes ({pendingRequests.length})
                            </TabsTrigger>
                            <TabsTrigger value="search">
                                <Search className="h-4 w-4 mr-2" />
                                Rechercher
                            </TabsTrigger>
                        </TabsList>

                        {/* Liste des amis */}
                        <TabsContent value="friends" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mes amis</CardTitle>
                                    <CardDescription>
                                        {friends.length === 0
                                            ? "Vous n'avez pas encore d'amis"
                                            : `${friends.length} ami${friends.length > 1 ? "s" : ""}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {friends.map((friendship) => (
                                            <div
                                                key={friendship.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <UserAvatar
                                                        avatar={friendship.friend.avatar}
                                                        avatarBorderColor={friendship.friend.avatarBorderColor}
                                                        username={friendship.friend.username || friendship.friend.name}
                                                        userId={friendship.friend.id}
                                                        size="md"
                                                        clickable={true}
                                                        isCurrentUser={false}
                                                    />
                                                    <div>
                                                        <p className="font-semibold">
                                                            {friendship.friend.username || friendship.friend.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {friendship.friend.totalCO2Saved.toFixed(1)} kg CO₂ économisés
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Demandes en attente */}
                        <TabsContent value="requests" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Demandes d'amis</CardTitle>
                                    <CardDescription>
                                        {pendingRequests.length === 0
                                            ? "Aucune demande en attente"
                                            : `${pendingRequests.length} demande${pendingRequests.length > 1 ? "s" : ""} en attente`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {pendingRequests.map((friendship) => (
                                            <div
                                                key={friendship.id}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <UserAvatar
                                                        avatar={friendship.friend.avatar}
                                                        avatarBorderColor={friendship.friend.avatarBorderColor}
                                                        username={friendship.friend.username || friendship.friend.name}
                                                        userId={friendship.friend.id}
                                                        size="md"
                                                        clickable={true}
                                                        isCurrentUser={false}
                                                    />
                                                    <div>
                                                        <p className="font-semibold">
                                                            {friendship.friend.username || friendship.friend.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {friendship.friend.totalCO2Saved.toFixed(1)} kg CO₂ économisés
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => respondToRequest(friendship.id, "accept")}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Accepter
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => respondToRequest(friendship.id, "reject")}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Refuser
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Recherche d'utilisateurs */}
                        <TabsContent value="search" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Trouver des amis</CardTitle>
                                    <CardDescription>
                                        Recherchez des utilisateurs par nom ou pseudo
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Rechercher un utilisateur..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    searchUsers(e.target.value);
                                                }}
                                            />
                                        </div>

                                        {isSearching ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Recherche...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="space-y-4">
                                                {searchResults.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center justify-between p-4 border rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <UserAvatar
                                                                avatar={user.avatar}
                                                                avatarBorderColor={user.avatarBorderColor}
                                                                username={user.username || user.name}
                                                                userId={user.id}
                                                                size="md"
                                                                clickable={false}
                                                                isCurrentUser={false}
                                                            />
                                                            <div>
                                                                <p className="font-semibold">
                                                                    {user.username || user.name}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {user.totalCO2Saved.toFixed(1)} kg CO₂ économisés
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => sendFriendRequest(user.id)}
                                                            disabled={user.id === session?.user?.id}
                                                        >
                                                            <UserPlus className="h-4 w-4 mr-2" />
                                                            Ajouter
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : searchQuery && !isSearching ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Aucun utilisateur trouvé
                                            </div>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
