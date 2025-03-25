# Fix this error. And please also make sure to check the last response that when checking cookie information to the Supabase client to maintain the user's authenticated session, is it getting from single source AuthProvider script, please make sure all auth session related stuff should be all handled by AuthProvider to do checking and sending result.

## Authentication Session Handling Fix

This update addresses authentication errors in API routes, specifically focusing on the comment liking functionality. The main issue was that the API route was unable to properly access the authentication session from cookies or headers, resulting in 401 Unauthorized errors.

### What Has Changed

1. **Enhanced AuthContext with Complete Token Management**

   - Added a new `getAuthTokens()` method that returns both access token and refresh token
   - Maintained backward compatibility with the existing `getAccessToken()` method
   - Made AuthContext the single source of truth for all authentication state

2. **Improved Client-Side Token Handling**

   - Updated the comment like handler to use `getAuthTokens()` instead of just `getAccessToken()`
   - Now sending both access token and refresh token to the API
   - Added proper error handling for missing tokens

3. **Refined Server-Side Authentication Flow**

   - Improved the API route to accept both access token and refresh token
   - Implemented a fallback mechanism if refresh token is invalid
   - Added comprehensive error logging for authentication failures
   - Fixed the method of setting the Supabase session with the token

4. **Proper Token Passing Between Client and Server**
   - Using Authorization header for the access token
   - Using a custom X-Refresh-Token header for the refresh token
   - Maintaining clean separation between authentication concerns

### Technical Details

The root cause of the error was that the Supabase client in the API route wasn't being properly authenticated with the user's session. This was fixed by:

1. **Correctly setting the session**: Using `supabaseServer.auth.setSession()` with both tokens
2. **Graceful degradation**: Falling back to just the access token if the refresh token is invalid
3. **Centralized auth management**: Using AuthContext as the single source of truth

### Next Steps

The authentication changes have been implemented and should fix the issue with liking comments. You should now be able to:

1. Like and unlike comments without getting 401 Unauthorized errors
2. See the like count update in real-time
3. Have the likes persist when refreshing the page

If you encounter any further authentication issues, please verify:

1. That you're logged in properly
2. That the AuthContext is properly initialized
3. Check the console logs for any specific error messages
