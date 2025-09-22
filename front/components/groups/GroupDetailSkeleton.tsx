'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function GroupDetailSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Group Header Card Skeleton */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Image Skeleton */}
            <div className='relative w-full lg:w-64 h-48 lg:h-64 rounded-lg bg-muted animate-pulse flex-shrink-0' />

            {/* Content Skeleton */}
            <div className='flex-1 space-y-4'>
              {/* Badges Skeleton */}
              <div className='flex gap-3'>
                <div className='h-6 w-20 bg-muted animate-pulse rounded-full' />
                <div className='h-6 w-16 bg-muted animate-pulse rounded-full' />
              </div>

              {/* Title and Description Skeleton */}
              <div className='space-y-2'>
                <div className='h-8 w-3/4 bg-muted animate-pulse rounded' />
                <div className='space-y-2'>
                  <div className='h-4 w-full bg-muted animate-pulse rounded' />
                  <div className='h-4 w-5/6 bg-muted animate-pulse rounded' />
                  <div className='h-4 w-4/6 bg-muted animate-pulse rounded' />
                </div>
              </div>

              {/* Stats Skeleton */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className='text-center p-3 bg-muted/50 rounded-lg'
                  >
                    <div className='h-8 w-12 bg-muted animate-pulse rounded mx-auto mb-2' />
                    <div className='h-4 w-16 bg-muted animate-pulse rounded mx-auto' />
                  </div>
                ))}
              </div>

              {/* President Info Skeleton */}
              <div className='flex items-center gap-3 p-4 bg-muted/30 rounded-lg'>
                <div className='w-10 h-10 bg-muted animate-pulse rounded-full' />
                <div className='space-y-2'>
                  <div className='h-4 w-20 bg-muted animate-pulse rounded' />
                  <div className='h-3 w-32 bg-muted animate-pulse rounded' />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid lg:grid-cols-2 gap-6'>
        {/* Members List Skeleton */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 bg-muted animate-pulse rounded' />
              <div className='h-6 w-32 bg-muted animate-pulse rounded' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-muted animate-pulse rounded-full' />
                    <div className='space-y-1'>
                      <div className='h-4 w-24 bg-muted animate-pulse rounded' />
                      <div className='h-3 w-16 bg-muted animate-pulse rounded' />
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <div className='h-5 w-12 bg-muted animate-pulse rounded-full' />
                    <div className='h-5 w-14 bg-muted animate-pulse rounded-full' />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events List Skeleton */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 bg-muted animate-pulse rounded' />
              <div className='h-6 w-40 bg-muted animate-pulse rounded' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='p-4 border rounded-lg'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 w-3/4 bg-muted animate-pulse rounded' />
                      <div className='flex gap-4'>
                        <div className='h-3 w-24 bg-muted animate-pulse rounded' />
                        <div className='h-3 w-20 bg-muted animate-pulse rounded' />
                      </div>
                      <div className='space-y-1'>
                        <div className='h-3 w-full bg-muted animate-pulse rounded' />
                        <div className='h-3 w-2/3 bg-muted animate-pulse rounded' />
                      </div>
                    </div>
                    <div className='h-5 w-16 bg-muted animate-pulse rounded-full' />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
