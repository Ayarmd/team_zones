<?php

namespace App\Http\Resources;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $registeredCount = $this->relationLoaded('participants')
            ? $this->participants->where('status', 'registered')->count()
            : $this->registeredParticipantsCount();

        $user = $request->user();
        $myParticipant = null;
        if ($user && $this->relationLoaded('participants')) {
            $myParticipant = $this->participants->firstWhere('user_id', $user->id);
        }

        return [
            'id' => (string) $this->id,
            'lounge_id' => (string) $this->station_id,
            'lounge_name' => $this->station?->name ?? '',
            'title' => $this->title,
            'game_name' => $this->game_name,
            'game_emoji' => $this->game_emoji,
            'cover_image_url' => MediaUrl::resolve($this->cover_image),
            'start_date' => $this->start_date?->toIso8601String(),
            'end_date' => $this->end_date?->toIso8601String(),
            'registration_deadline' => $this->registration_deadline?->toIso8601String(),
            'prize_summary' => $this->prize_summary,
            'entry_fee' => (float) $this->entry_fee,
            'match_rules' => $this->match_rules,
            'delay_minutes' => (int) ($this->delay_minutes ?? 10),
            'status' => $this->status,
            'max_participants' => (int) $this->max_participants,
            'participants_count' => $registeredCount,
            'is_full' => $registeredCount >= (int) $this->max_participants,
            'is_registration_open' => $this->isRegistrationOpen(),
            'can_join' => $this->isRegistrationOpen()
                && ! $this->isFull()
                && (! $myParticipant || $myParticipant->status === 'withdrawn'),
            'my_registration_status' => $myParticipant?->status,
            'participants' => TournamentParticipantResource::collection(
                $this->relationLoaded('participants')
                    ? $this->participants->where('status', 'registered')->values()
                    : collect()
            )->resolve(),
            'matches' => $this->when(
                $this->relationLoaded('matches'),
                fn () => TournamentMatchResource::collection($this->matches)->resolve(),
                []
            ),
        ];
    }
}
