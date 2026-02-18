"use client"

import { useState, useEffect } from "react"
import { Bell, Check, UserPlus, Trophy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    data?: any
    isRead: boolean
    createdAt: string
}

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications")
            if (response.ok) {
                const data = await response.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const markAllAsRead = async () => {
        if (unreadCount === 0) return

        try {
            const response = await fetch("/api/notifications", {
                method: "PATCH",
            })

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, isRead: true }))
                )
                setUnreadCount(0)
            }
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (open) {
            markAllAsRead()
        }
    }

    const handleFriendRequest = async (notificationId: string, action: "accept" | "reject") => {
        const notification = notifications.find(n => n.id === notificationId)
        if (!notification?.data?.friendshipId) return

        try {
            const response = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    friendshipId: notification.data.friendshipId,
                    action,
                }),
            })

            if (response.ok) {
                await deleteNotification(notificationId)
                fetchNotifications()
            }
        } catch (error) {
            console.error("Failed to respond to friend request:", error)
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: "DELETE",
            })

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId))
                const wasUnread = notifications.find(n => n.id === notificationId)?.isRead === false
                if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error("Failed to delete notification:", error)
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "friend_request":
                return <UserPlus className="h-4 w-4 text-blue-500" />
            case "challenge_completed":
                return <Trophy className="h-4 w-4 text-yellow-500" />
            case "cosmetic_unlocked":
                return <Sparkles className="h-4 w-4 text-purple-500" />
            default:
                return <Bell className="h-4 w-4 text-gray-500" />
        }
    }

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return "À l'instant"
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`
        if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    }

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-white">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            {unreadCount} non {unreadCount > 1 ? "lues" : "lue"}
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Chargement...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Aucune notification
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "relative px-2 py-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0",
                                !notification.isRead && "bg-blue-50 dark:bg-blue-950/20"
                            )}
                            onClick={() => deleteNotification(notification.id)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight">
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatRelativeTime(notification.createdAt)}
                                    </p>

                                    {/* Actions pour les demandes d'amis */}
                                    {notification.type === "friend_request" && !notification.isRead && (
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-7 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleFriendRequest(notification.id, "accept")
                                                }}
                                            >
                                                Accepter
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleFriendRequest(notification.id, "reject")
                                                }}
                                            >
                                                Refuser
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
