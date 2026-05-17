import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function App() {

  // ---------------- STATES ----------------

  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("cpp");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // AUTH STATES
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [isLogin, setIsLogin] = useState(true);

  // ---------------- FETCH HISTORY ----------------

  const fetchHistory = async () => {
    if (!token) return;
    try {

      const response = await fetch(
        "https://ai-code-reviewer-7g6o.onrender.com/reviews",
        // "http://127.0.0.1:8000/reviews",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const data = await response.json();

      // setHistory(data.reverse());
      setHistory(Array.isArray(data) ? data.reverse() : []);

    } catch (error) {

      console.error(error);
    }
  };

  // useEffect(() => {
  //   fetchHistory();
  // }, []);
  // Wake up Render server on app load
  useEffect(() => {
    fetch("https://ai-code-reviewer-7g6o.onrender.com/")
      .catch(() => {});
  }, []);
   useEffect(() => {

    if (token) {
      fetchHistory();
    }

  }, [token]);

  // ---------------- AUTH ----------------

  const handleAuth = async () => {

    try {

      const endpoint = isLogin
        ? "login"
        : "signup";

      const response = await fetch(
        `https://ai-code-reviewer-7g6o.onrender.com/${endpoint}`,
        // `http://127.0.0.1:8000/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.token) {

        localStorage.setItem(
          "token",
          data.token
        );

        setToken(data.token);

      } else if (data.message) {

        alert(data.message);

        setIsLogin(true);

      } else if (data.error) {

        alert(data.error);
      }

    } catch (error) {

      console.error(error);
    }
  };

  // ---------------- REVIEW CODE ----------------

  const reviewCode = async () => {

    if (!code.trim()) {

      alert("Please enter code");

      return;
    }

    setLoading(true);

    setReview("");

    try {

      const response = await fetch(
        "https://ai-code-reviewer-7g6o.onrender.com/review",
        // "http://127.0.0.1:8000/review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
             Authorization: token,
          },
          body: JSON.stringify({
            code: code,
            language: language,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.review) {

        setReview(data.review);

        fetchHistory();

      } else if (data.error) {

        setReview(data.error);

      } else {

        setReview("No response from AI");
      }

    } catch (error) {

      console.error(error);

      setReview("Frontend Error");

    } finally {

      setLoading(false);
    }
  };

  // ---------------- COPY ----------------

  const copyToClipboard = async () => {

    if (!review) return;

    try {

      await navigator.clipboard.writeText(review);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.error(error);
    }
  };

  // ---------------- AUTH SCREEN ----------------

  if (!token) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        <div className="bg-zinc-900 p-8 rounded-2xl w-96 border border-zinc-800">

          <h1 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? "Login" : "Sign Up"}
          </h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
          />

          <button
            onClick={handleAuth}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <p className="text-center mt-4 text-zinc-400">

            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-white"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>

          </p>

        </div>

      </div>
    );
  }

  // ---------------- MAIN APP ----------------

  return (

    <div className="min-h-screen bg-black text-white flex relative">

      {/* SIDEBAR */}

      <div className="w-80 bg-zinc-950 border-r border-zinc-800 p-4 overflow-y-auto">

        <h2 className="text-2xl font-bold mb-6">
          History
        </h2>

        <div className="space-y-4">

          {history.map((item) => (

            <div
              key={item.id}
              onClick={() => {
                setCode(item.code);
                setReview(item.review);
                setLanguage(item.language);
              }}
              className="bg-zinc-900 hover:bg-zinc-800 p-4 rounded-xl cursor-pointer transition-all"
            >

              <p className="text-sm text-zinc-400 mb-2">
                {item.language}
              </p>

              <p className="line-clamp-3 text-sm">
                {item.code}
              </p>

            </div>
          ))}

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="flex-1 p-8">

        <button
          onClick={() => {
            localStorage.removeItem("token");
            setToken("");
          }}
          className="absolute top-4 right-4 bg-red-500 px-4 py-2 rounded-lg"
        >
          Logout
        </button>

        <div className="max-w-4xl mx-auto">

          <h1 className="text-4xl font-bold text-center mb-8">
            AI Code Reviewer
          </h1>

          {/* LANGUAGE SELECT */}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mb-4 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-lg"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>

          {/* EDITOR */}

          <Editor
            height="500px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
          />

          {/* BUTTON */}

          <button
            onClick={reviewCode}
            disabled={loading}
            className={`
              mt-4 px-6 py-3 rounded-xl font-semibold transition-all duration-200
              ${loading
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-white text-black hover:scale-105"}
            `}
          >

            {loading ? (
              <div className="flex items-center gap-2">

                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

                Reviewing...

              </div>
            ) : (
              "Review Code"
            )}

          </button>

          {/* REVIEW SECTION */}

          <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-700 min-h-[200px] overflow-auto relative">

            {review && (

              <button
                onClick={copyToClipboard}
                className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-all"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}

            {review ? (

              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {

                    const match = /language-(\w+)/.exec(className || "");

                    return !inline && match ? (

                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>

                    ) : (

                      <code className="bg-zinc-800 px-1 py-0.5 rounded">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {review}
              </ReactMarkdown>

            ) : (

              loading
                ? "AI is reviewing your code..."
                : "AI review will appear here..."
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;



//import { useState, useEffect } from "react";
// import Editor from "@monaco-editor/react";
// import ReactMarkdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

// import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// function App() {

//   const [code, setCode] = useState("");
//   const [review, setReview] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [language, setLanguage] = useState("cpp");
//   const [copied, setCopied] = useState(false);
//   const [history, setHistory] = useState([]);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [token, setToken] = useState(
//     localStorage.getItem("token") || ""
//   );
//   const [isLogin, setIsLogin] = useState(true);

  


//   const fetchHistory = async () => {

//       try {

//         const response = await fetch(
//           "http://127.0.0.1:8000/reviews"
//         );

//         const data = await response.json();

//         setHistory(data.reverse());

//       } catch (error) {

//         console.error(error);
//       }
//   };
//     useEffect(() => {
//       fetchHistory();
//     }, []);

//   const handleAuth = async () => {

//   try {

//     const endpoint = isLogin
//       ? "login"
//       : "signup";

//     const response = await fetch(
//       `http://127.0.0.1:8000/${endpoint}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           username,
//           password,
//         }),
//       }
//     );

//     const data = await response.json();

//     console.log(data);

//     if (data.token) {

//       localStorage.setItem(
//         "token",
//         data.token
//       );

//       setToken(data.token);

//     } else if (data.message) {

//       alert(data.message);

//       setIsLogin(true);

//     } else if (data.error) {

//       alert(data.error);
//     }

//   } catch (error) {

//     console.error(error);
//   }
// };

//   const reviewCode = async () => {

//     if (!code.trim()) {
//       alert("Please enter code");
//       return;
//     }

//     setLoading(true);
//     setReview("");
  

//     try {

//       const response = await fetch("http://127.0.0.1:8000/review", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           code: code,
//           language: language,
//         }),
//       });

//       const data = await response.json();

//       console.log(data);

//       if (data.review) {
//         setReview(data.review);
//         fetchHistory();
//       } else if (data.error) {
//         setReview(data.error);
//       } else {
//         setReview("No response from AI");
//       }

//     } catch (error) {

//       console.error(error);

//       setReview("Frontend Error");
//     }

//     setLoading(false);
//   };

//   const copyToClipboard = async () => {

//   if (!review) return;

//   try {

//     await navigator.clipboard.writeText(review);

//     setCopied(true);

//     setTimeout(() => {
//       setCopied(false);
//     }, 2000);

//   } catch (error) {

//     console.error(error);
//   }
// };



//   if (!token) {
//   return (
     
//       <div className="min-h-screen bg-black text-white flex items-center justify-center">

//       <div className="bg-zinc-900 p-8 rounded-2xl w-96 border border-zinc-800">

//         <h1 className="text-3xl font-bold mb-6 text-center">
//           {isLogin ? "Login" : "Sign Up"}
//         </h1>

//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           className="w-full mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="w-full mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
//         />

//         <button
//           onClick={handleAuth}
//           className="w-full bg-white text-black py-3 rounded-lg font-semibold"
//         >
//           {isLogin ? "Login" : "Sign Up"}
//         </button>

//         <p className="text-center mt-4 text-zinc-400">

//           {isLogin
//             ? "Don't have an account?"
//             : "Already have an account?"}

//           <button
//             onClick={() => setIsLogin(!isLogin)}
//             className="ml-2 text-white"
//           >
//             {isLogin ? "Sign Up" : "Login"}
//           </button>

//         </p>

//       </div>

//     </div>
//   );
//   }
 

//     // <div className="min-h-screen bg-black text-white p-8">
//     <div className="min-h-screen bg-black text-white flex">
//       <div className="w-80 bg-zinc-950 border-r border-zinc-800 p-4 overflow-y-auto">

//       <h2 className="text-2xl font-bold mb-6">
//         History
//       </h2>

//       <div className="space-y-4">

//         {history.map((item) => (

//           <div
//             key={item.id}
//             onClick={() => {
//               setCode(item.code);
//               setReview(item.review);
//               setLanguage(item.language);
//             }}
//             className="bg-zinc-900 hover:bg-zinc-800 p-4 rounded-xl cursor-pointer transition-all"
//           >

//             <p className="text-sm text-zinc-400 mb-2">
//               {item.language}
//             </p>

//             <p className="line-clamp-3 text-sm">
//               {item.code}
//             </p>

//           </div>
//         ))}

//       </div>

//     </div>

//       <h1 className="text-4xl font-bold text-center mb-8">
//         AI Code Reviewer
//       </h1>
//       <button
//         onClick={() => {
//           localStorage.removeItem("token");
//           setToken("");
//         }}
//         className="absolute top-4 right-4 bg-red-500 px-4 py-2 rounded-lg"
//       >
//         Logout
//       </button>

//       {/* <div className="max-w-4xl mx-auto"> */}
//       <div className="flex-1 p-8">
//       <div className="max-w-4xl mx-auto">

//         {/* <textarea
//           value={code}
//           onChange={(e) => setCode(e.target.value)}
//           placeholder="Paste your code here..."
//           className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 font-mono"
//         /> */}
//         <select
//           value={language}
//           onChange={(e) => setLanguage(e.target.value)}
//           className="mb-4 bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-lg"
//         >
//           <option value="cpp">C++</option>
//           <option value="python">Python</option>
//           <option value="javascript">JavaScript</option>
//           <option value="java">Java</option>
//         </select>

//         <Editor
//             height="500px"
//             // defaultLanguage="cpp"
//             language={language}
//             theme="vs-dark"
//             value={code}
//             onChange={(value) => setCode(value)}
//         />

//         <button
//           onClick={reviewCode}
//           className="mt-4 bg-white text-black px-6 py-3 rounded-xl font-semibold"
//         >
//           {loading ? "Reviewing..." : "Review Code"}
//         </button>

//         {/* <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-700 min-h-[200px] whitespace-pre-wrap">

//           {review || "AI review will appear here..."}

//         </div> */}
//         {/* <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-700 min-h-[200px] overflow-auto"> */}
//         <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-700 min-h-[200px] overflow-auto relative">
//         {review && (
//           <button
//             onClick={copyToClipboard}
//             className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-all"
//           >
//             {copied ? "Copied!" : "Copy"}
//           </button>
//         )}
        
//         {review ? (
//           <ReactMarkdown
//           components={{
//             code({ inline, className, children, ...props }) {

//               const match = /language-(\w+)/.exec(className || "");

//               return !inline && match ? (

//                 <SyntaxHighlighter
//                   style={oneDark}
//                   language={match[1]}
//                   PreTag="div"
//                   {...props}
//                 >
//                   {String(children).replace(/\n$/, "")}
//                 </SyntaxHighlighter>

//               ) : (

//                 <code className="bg-zinc-800 px-1 py-0.5 rounded">
//                   {children}
//                 </code>
//               );
//             },
//           }}
//         >
//           {review}
//         </ReactMarkdown>
//         ) : (
//           "AI review will appear here..."
//         )}
//         </div>
//         </div>

//       </div>

//     </div>
  
//   );

// }

// export default App;










// function App() {
//   return (
//     <div className="min-h-screen bg-black text-white flex items-center justify-center">
//       <h1 className="text-4xl font-bold">
//         AI Code Reviewer
//       </h1>
//     </div>
//   );
// }

// export default App;


// import { useState } from "react";

// function App() {
//   const [code, setCode] = useState("");
//   const [review, setReview] = useState("");
//   const [loading, setLoading] = useState(false);

//   const reviewCode = async () => {
//     if (!code.trim()) return;

//     setLoading(true);

//     try {
//       const response = await fetch("http://127.0.0.1:8000/review", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           code: code,
//         }),
//       });

//       const data = await response.json();

//       setReview(data.review);

//     } catch (error) {
//       console.error(error);
//       setReview("Something went wrong.");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-black text-white p-8">

//       <h1 className="text-4xl font-bold mb-8 text-center">
//         AI Code Reviewer
//       </h1>

//       <div className="max-w-4xl mx-auto">

//         <textarea
//           value={code}
//           onChange={(e) => setCode(e.target.value)}
//           placeholder="Paste your code here..."
//           className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-sm font-mono outline-none"
//         />

//         <button
//           onClick={reviewCode}
//           className="mt-4 px-6 py-3 bg-white text-black rounded-xl font-semibold"
//         >
//           {loading ? "Reviewing..." : "Review Code"}
//         </button>

//         {review && (
//           <div className="mt-8 bg-zinc-900 p-6 rounded-xl border border-zinc-700 whitespace-pre-wrap">
//             {review}
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// export default App;